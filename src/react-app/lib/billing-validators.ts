/**
 * Billing validation utilities to prevent common billing errors
 * Part of RAY-45 billing system improvements
 */

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id?: string;
  $id?: string;
  invoice_number: string;
  total: number;
  amount?: number;
  subtotal?: number;
  taxes?: number;
  discounts?: number;
  status: string;
  line_items?: LineItem[] | string;
}

export interface Payment {
  id?: string;
  $id?: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  reference?: string;
}

export class BillingValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BillingValidationError';
  }
}

/**
 * Validate line item values
 */
export function validateLineItem(item: LineItem): void {
  if (!item.description || item.description.trim() === '') {
    throw new BillingValidationError(
      'Line item description is required',
      'MISSING_DESCRIPTION'
    );
  }

  if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
    throw new BillingValidationError(
      'Line item quantity must be a valid number',
      'INVALID_QUANTITY'
    );
  }

  if (typeof item.rate !== 'number' || isNaN(item.rate)) {
    throw new BillingValidationError(
      'Line item rate must be a valid number',
      'INVALID_RATE'
    );
  }

  if (item.quantity < 0) {
    throw new BillingValidationError(
      'Line item quantity cannot be negative',
      'NEGATIVE_QUANTITY'
    );
  }

  if (item.rate < 0) {
    throw new BillingValidationError(
      'Line item rate cannot be negative',
      'NEGATIVE_RATE'
    );
  }

  // Calculate expected amount
  const expectedAmount = item.quantity * item.rate;
  const amountDiff = Math.abs(item.amount - expectedAmount);
  
  // Allow for small floating point differences (1 cent)
  if (amountDiff > 0.01) {
    throw new BillingValidationError(
      `Line item amount (${item.amount}) does not match quantity (${item.quantity}) × rate (${item.rate}) = ${expectedAmount}`,
      'AMOUNT_MISMATCH'
    );
  }
}

/**
 * Validate invoice totals
 */
export function validateInvoice(invoice: Invoice): void {
  // Parse line items if stored as string
  let lineItems: LineItem[] = [];
  if (typeof invoice.line_items === 'string') {
    try {
      lineItems = JSON.parse(invoice.line_items);
    } catch {
      throw new BillingValidationError(
        'Invalid line items format',
        'INVALID_LINE_ITEMS'
      );
    }
  } else if (Array.isArray(invoice.line_items)) {
    lineItems = invoice.line_items;
  }

  // Validate each line item
  lineItems.forEach((item, index) => {
    try {
      validateLineItem(item);
    } catch (error) {
      if (error instanceof BillingValidationError) {
        throw new BillingValidationError(
          `Line item ${index + 1}: ${error.message}`,
          error.code
        );
      }
      throw error;
    }
  });

  // Validate total is positive
  if (typeof invoice.total !== 'number' || isNaN(invoice.total)) {
    throw new BillingValidationError(
      'Invoice total must be a valid number',
      'INVALID_TOTAL'
    );
  }

  if (invoice.total < 0) {
    throw new BillingValidationError(
      'Invoice total cannot be negative',
      'NEGATIVE_TOTAL'
    );
  }

  // Validate subtotal matches line items sum
  if (invoice.subtotal !== undefined && lineItems.length > 0) {
    const calculatedSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const subtotalDiff = Math.abs(invoice.subtotal - calculatedSubtotal);
    
    if (subtotalDiff > 0.01) {
      throw new BillingValidationError(
        `Invoice subtotal (${invoice.subtotal}) does not match sum of line items (${calculatedSubtotal})`,
        'SUBTOTAL_MISMATCH'
      );
    }
  }

  // Validate total calculation
  if (invoice.subtotal !== undefined) {
    const taxes = invoice.taxes || 0;
    const discounts = invoice.discounts || 0;
    const calculatedTotal = invoice.subtotal + taxes - discounts;
    const totalDiff = Math.abs(invoice.total - calculatedTotal);
    
    if (totalDiff > 0.01) {
      throw new BillingValidationError(
        `Invoice total (${invoice.total}) does not match calculated total (${calculatedTotal}) = subtotal (${invoice.subtotal}) + taxes (${taxes}) - discounts (${discounts})`,
        'TOTAL_MISMATCH'
      );
    }
  }

  // Warn if invoice has no line items
  if (lineItems.length === 0 && invoice.total > 0) {
    console.warn(`Invoice ${invoice.invoice_number} has a total of ${invoice.total} but no line items`);
  }

  // Warn if creating zero-amount invoice
  if (invoice.total === 0) {
    console.warn(`Invoice ${invoice.invoice_number} has a total of $0.00`);
  }
}

/**
 * Validate payment amount
 */
export function validatePayment(
  payment: Payment,
  invoice: Invoice,
  existingPayments: Payment[] = []
): void {
  // Validate payment amount
  if (typeof payment.amount !== 'number' || isNaN(payment.amount)) {
    throw new BillingValidationError(
      'Payment amount must be a valid number',
      'INVALID_AMOUNT'
    );
  }

  if (payment.amount <= 0) {
    throw new BillingValidationError(
      'Payment amount must be greater than zero',
      'NON_POSITIVE_AMOUNT'
    );
  }

  // Calculate total paid so far
  const totalPaid = existingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = invoice.total - totalPaid;

  // Check for overpayment
  if (payment.amount > remaining + 0.01) { // Allow 1 cent tolerance
    throw new BillingValidationError(
      `Payment amount ($${payment.amount.toFixed(2)}) exceeds remaining balance ($${remaining.toFixed(2)})`,
      'OVERPAYMENT'
    );
  }

  // Validate payment method
  const validMethods = ['Card', 'ACH', 'Cash', 'Check', 'Wire', 'Other'];
  if (!validMethods.includes(payment.payment_method)) {
    throw new BillingValidationError(
      `Invalid payment method: ${payment.payment_method}. Must be one of: ${validMethods.join(', ')}`,
      'INVALID_PAYMENT_METHOD'
    );
  }

  // Validate reference for check payments
  if (payment.payment_method === 'Check' && !payment.reference) {
    console.warn('Check payment should include a check number in the reference field');
  }
}

/**
 * Calculate invoice total with validation
 */
export function calculateInvoiceTotal(
  lineItems: LineItem[],
  taxRate: number = 0,
  discountRate: number = 0
): { subtotal: number; taxes: number; discounts: number; total: number } {
  // Validate inputs
  if (!Array.isArray(lineItems)) {
    throw new BillingValidationError(
      'Line items must be an array',
      'INVALID_LINE_ITEMS'
    );
  }

  if (typeof taxRate !== 'number' || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new BillingValidationError(
      'Tax rate must be a number between 0 and 100',
      'INVALID_TAX_RATE'
    );
  }

  if (typeof discountRate !== 'number' || isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
    throw new BillingValidationError(
      'Discount rate must be a number between 0 and 100',
      'INVALID_DISCOUNT_RATE'
    );
  }

  // Validate each line item and calculate subtotal
  const subtotal = lineItems.reduce((sum, item, index) => {
    try {
      validateLineItem(item);
    } catch (error) {
      if (error instanceof BillingValidationError) {
        throw new BillingValidationError(
          `Line item ${index + 1}: ${error.message}`,
          error.code
        );
      }
      throw error;
    }
    return sum + item.amount;
  }, 0);

  // Calculate taxes and discounts
  const taxes = subtotal * (taxRate / 100);
  const discounts = subtotal * (discountRate / 100);
  const total = subtotal + taxes - discounts;

  return {
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    taxes: Math.round(taxes * 100) / 100,
    discounts: Math.round(discounts * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Safely normalize ID field from database document
 */
export function normalizeId(doc: Record<string, unknown>): string {
  const id = doc.id ?? doc.$id ?? doc._id;
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  throw new BillingValidationError(
    'Document does not have a valid ID field',
    'MISSING_ID'
  );
}

/**
 * Safely get numeric value with fallback
 */
export function getNumericValue(
  value: unknown,
  fallback: number = 0
): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate matter-client association
 */
export function validateMatterClientAssociation(
  matterId: string | undefined,
  clientId: string | undefined
): void {
  if (!matterId || matterId.trim() === '') {
    throw new BillingValidationError(
      'Matter ID is required',
      'MISSING_MATTER_ID'
    );
  }

  if (!clientId || clientId.trim() === '') {
    throw new BillingValidationError(
      'Client ID is required for matter',
      'MISSING_CLIENT_ID'
    );
  }
}
