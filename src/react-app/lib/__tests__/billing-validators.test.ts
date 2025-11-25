import { describe, it, expect } from 'vitest';
import {
  validateLineItem,
  validateInvoice,
  validatePayment,
  calculateInvoiceTotal,
  normalizeId,
  getNumericValue,
  formatCurrency,
  validateMatterClientAssociation,
  BillingValidationError,
  type LineItem,
  type Invoice,
  type Payment,
} from '../billing-validators';

describe('billing-validators', () => {
  describe('validateLineItem', () => {
    it('should pass validation for valid line item', () => {
      const lineItem: LineItem = {
        description: 'Legal Services',
        quantity: 5,
        rate: 250,
        amount: 1250,
      };
      expect(() => validateLineItem(lineItem)).not.toThrow();
    });

    it('should throw error for missing description', () => {
      const lineItem: LineItem = {
        description: '',
        quantity: 5,
        rate: 250,
        amount: 1250,
      };
      expect(() => validateLineItem(lineItem)).toThrow(BillingValidationError);
      expect(() => validateLineItem(lineItem)).toThrow('description is required');
    });

    it('should throw error for invalid quantity', () => {
      const lineItem: LineItem = {
        description: 'Legal Services',
        quantity: NaN,
        rate: 250,
        amount: 1250,
      };
      expect(() => validateLineItem(lineItem)).toThrow(BillingValidationError);
      expect(() => validateLineItem(lineItem)).toThrow('quantity must be a valid number');
    });

    it('should throw error for negative quantity', () => {
      const lineItem: LineItem = {
        description: 'Legal Services',
        quantity: -5,
        rate: 250,
        amount: -1250,
      };
      expect(() => validateLineItem(lineItem)).toThrow(BillingValidationError);
      expect(() => validateLineItem(lineItem)).toThrow('quantity cannot be negative');
    });

    it('should throw error for negative rate', () => {
      const lineItem: LineItem = {
        description: 'Legal Services',
        quantity: 5,
        rate: -250,
        amount: -1250,
      };
      expect(() => validateLineItem(lineItem)).toThrow(BillingValidationError);
      expect(() => validateLineItem(lineItem)).toThrow('rate cannot be negative');
    });

    it('should throw error for amount mismatch', () => {
      const lineItem: LineItem = {
        description: 'Legal Services',
        quantity: 5,
        rate: 250,
        amount: 1000, // Should be 1250
      };
      expect(() => validateLineItem(lineItem)).toThrow(BillingValidationError);
      expect(() => validateLineItem(lineItem)).toThrow('amount');
      expect(() => validateLineItem(lineItem)).toThrow('does not match');
    });

    it('should allow small floating point differences', () => {
      const lineItem: LineItem = {
        description: 'Legal Services',
        quantity: 3,
        rate: 333.33,
        amount: 999.99, // Actual calculation: 999.99
      };
      expect(() => validateLineItem(lineItem)).not.toThrow();
    });

    it('should handle zero quantity', () => {
      const lineItem: LineItem = {
        description: 'Consultation',
        quantity: 0,
        rate: 250,
        amount: 0,
      };
      expect(() => validateLineItem(lineItem)).not.toThrow();
    });

    it('should handle zero rate', () => {
      const lineItem: LineItem = {
        description: 'Pro Bono Services',
        quantity: 5,
        rate: 0,
        amount: 0,
      };
      expect(() => validateLineItem(lineItem)).not.toThrow();
    });
  });

  describe('validateInvoice', () => {
    it('should pass validation for valid invoice', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 1250,
        subtotal: 1250,
        taxes: 0,
        discounts: 0,
        status: 'Draft',
        line_items: [
          {
            description: 'Legal Services',
            quantity: 5,
            rate: 250,
            amount: 1250,
          },
        ],
      };
      expect(() => validateInvoice(invoice)).not.toThrow();
    });

    it('should throw error for negative total', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: -1250,
        status: 'Draft',
        line_items: [],
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('total cannot be negative');
    });

    it('should throw error for invalid total', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: NaN,
        status: 'Draft',
        line_items: [],
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('total must be a valid number');
    });

    it('should validate line items when present', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 1250,
        status: 'Draft',
        line_items: [
          {
            description: '', // Invalid
            quantity: 5,
            rate: 250,
            amount: 1250,
          },
        ],
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('Line item 1');
    });

    it('should validate subtotal matches line items', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 1250,
        subtotal: 1000, // Should be 1250
        status: 'Draft',
        line_items: [
          {
            description: 'Legal Services',
            quantity: 5,
            rate: 250,
            amount: 1250,
          },
        ],
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('subtotal');
      expect(() => validateInvoice(invoice)).toThrow('does not match');
    });

    it('should validate total calculation with taxes and discounts', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 1300,
        subtotal: 1000,
        taxes: 100,
        discounts: 50,
        status: 'Draft',
        line_items: [],
      };
      // Total should be 1000 + 100 - 50 = 1050, not 1300
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('total');
      expect(() => validateInvoice(invoice)).toThrow('does not match');
    });

    it('should handle string line_items', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 1250,
        status: 'Draft',
        line_items: JSON.stringify([
          {
            description: 'Legal Services',
            quantity: 5,
            rate: 250,
            amount: 1250,
          },
        ]),
      };
      expect(() => validateInvoice(invoice)).not.toThrow();
    });

    it('should throw error for invalid line_items JSON', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 1250,
        status: 'Draft',
        line_items: 'invalid json',
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('Invalid line items format');
    });

    it('should allow zero total invoice', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 0,
        status: 'Draft',
        line_items: [],
      };
      expect(() => validateInvoice(invoice)).not.toThrow();
    });
  });

  describe('validatePayment', () => {
    const mockInvoice: Invoice = {
      invoice_number: 'INV-001',
      total: 1000,
      status: 'Sent',
    };

    it('should pass validation for valid payment', () => {
      const payment: Payment = {
        invoice_id: 'inv1',
        amount: 500,
        payment_method: 'Card',
      };
      expect(() => validatePayment(payment, mockInvoice)).not.toThrow();
    });

    it('should throw error for invalid amount', () => {
      const payment: Payment = {
        invoice_id: 'inv1',
        amount: NaN,
        payment_method: 'Card',
      };
      expect(() => validatePayment(payment, mockInvoice)).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, mockInvoice)).toThrow('amount must be a valid number');
    });

    it('should throw error for non-positive amount', () => {
      const payment: Payment = {
        invoice_id: 'inv1',
        amount: 0,
        payment_method: 'Card',
      };
      expect(() => validatePayment(payment, mockInvoice)).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, mockInvoice)).toThrow('amount must be greater than zero');
    });

    it('should throw error for overpayment', () => {
      const payment: Payment = {
        invoice_id: 'inv1',
        amount: 1500,
        payment_method: 'Card',
      };
      expect(() => validatePayment(payment, mockInvoice)).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, mockInvoice)).toThrow('exceeds remaining balance');
    });

    it('should account for existing payments', () => {
      const payment: Payment = {
        invoice_id: 'inv1',
        amount: 600,
        payment_method: 'Card',
      };
      const existingPayments: Payment[] = [
        {
          invoice_id: 'inv1',
          amount: 500,
          payment_method: 'Card',
        },
      ];
      // Total: 1000, Paid: 500, Remaining: 500, Trying to pay: 600
      expect(() => validatePayment(payment, mockInvoice, existingPayments)).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, mockInvoice, existingPayments)).toThrow('exceeds remaining balance');
    });

    it('should allow full payment of remaining balance', () => {
      const payment: Payment = {
        invoice_id: 'inv1',
        amount: 500,
        payment_method: 'Card',
      };
      const existingPayments: Payment[] = [
        {
          invoice_id: 'inv1',
          amount: 500,
          payment_method: 'Card',
        },
      ];
      expect(() => validatePayment(payment, mockInvoice, existingPayments)).not.toThrow();
    });

    it('should throw error for invalid payment method', () => {
      const payment: Payment = {
        invoice_id: 'inv1',
        amount: 500,
        payment_method: 'Bitcoin',
      };
      expect(() => validatePayment(payment, mockInvoice)).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, mockInvoice)).toThrow('Invalid payment method');
    });

    it('should accept all valid payment methods', () => {
      const validMethods = ['Card', 'ACH', 'Cash', 'Check', 'Wire', 'Other'];
      validMethods.forEach(method => {
        const payment: Payment = {
          invoice_id: 'inv1',
          amount: 500,
          payment_method: method,
        };
        expect(() => validatePayment(payment, mockInvoice)).not.toThrow();
      });
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('should calculate totals correctly', () => {
      const lineItems: LineItem[] = [
        { description: 'Service 1', quantity: 2, rate: 100, amount: 200 },
        { description: 'Service 2', quantity: 3, rate: 150, amount: 450 },
      ];
      const result = calculateInvoiceTotal(lineItems, 10, 5);
      
      expect(result.subtotal).toBe(650);
      expect(result.taxes).toBe(65);
      expect(result.discounts).toBe(32.5);
      expect(result.total).toBe(682.5);
    });

    it('should handle zero tax and discount rates', () => {
      const lineItems: LineItem[] = [
        { description: 'Service', quantity: 1, rate: 100, amount: 100 },
      ];
      const result = calculateInvoiceTotal(lineItems, 0, 0);
      
      expect(result.subtotal).toBe(100);
      expect(result.taxes).toBe(0);
      expect(result.discounts).toBe(0);
      expect(result.total).toBe(100);
    });

    it('should throw error for invalid line items', () => {
      const lineItems = null as unknown as LineItem[];
      expect(() => calculateInvoiceTotal(lineItems)).toThrow(BillingValidationError);
      expect(() => calculateInvoiceTotal(lineItems)).toThrow('Line items must be an array');
    });

    it('should throw error for invalid tax rate', () => {
      const lineItems: LineItem[] = [];
      expect(() => calculateInvoiceTotal(lineItems, -1)).toThrow(BillingValidationError);
      expect(() => calculateInvoiceTotal(lineItems, 101)).toThrow(BillingValidationError);
    });

    it('should throw error for invalid discount rate', () => {
      const lineItems: LineItem[] = [];
      expect(() => calculateInvoiceTotal(lineItems, 0, -1)).toThrow(BillingValidationError);
      expect(() => calculateInvoiceTotal(lineItems, 0, 101)).toThrow(BillingValidationError);
    });

    it('should round to 2 decimal places', () => {
      const lineItems: LineItem[] = [
        { description: 'Service', quantity: 3, rate: 333.33, amount: 999.99 },
      ];
      const result = calculateInvoiceTotal(lineItems, 10, 5);
      
      // Each value should have at most 2 decimal places
      expect(result.subtotal.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.taxes.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.discounts.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.total.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should handle empty line items', () => {
      const result = calculateInvoiceTotal([], 10, 5);
      
      expect(result.subtotal).toBe(0);
      expect(result.taxes).toBe(0);
      expect(result.discounts).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('normalizeId', () => {
    it('should extract id field', () => {
      expect(normalizeId({ id: 'test123' })).toBe('test123');
    });

    it('should extract $id field', () => {
      expect(normalizeId({ $id: 'test456' })).toBe('test456');
    });

    it('should extract _id field', () => {
      expect(normalizeId({ _id: 'test789' })).toBe('test789');
    });

    it('should prefer id over $id', () => {
      expect(normalizeId({ id: 'id-value', $id: 'dollar-id-value' })).toBe('id-value');
    });

    it('should convert numeric id to string', () => {
      expect(normalizeId({ id: 123 })).toBe('123');
    });

    it('should throw error for missing id', () => {
      expect(() => normalizeId({})).toThrow(BillingValidationError);
      expect(() => normalizeId({})).toThrow('does not have a valid ID field');
    });
  });

  describe('getNumericValue', () => {
    it('should return numeric value', () => {
      expect(getNumericValue(42)).toBe(42);
    });

    it('should parse string numbers', () => {
      expect(getNumericValue('42.5')).toBe(42.5);
    });

    it('should return fallback for invalid values', () => {
      expect(getNumericValue('invalid', 0)).toBe(0);
      expect(getNumericValue(null, 10)).toBe(10);
      expect(getNumericValue(undefined, 20)).toBe(20);
    });

    it('should return fallback for NaN', () => {
      expect(getNumericValue(NaN, 5)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(getNumericValue(-42)).toBe(-42);
      expect(getNumericValue('-42.5')).toBe(-42.5);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('should format negative amounts', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should always show 2 decimal places', () => {
      expect(formatCurrency(1000.5)).toBe('$1,000.50');
      expect(formatCurrency(1000.1)).toBe('$1,000.10');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(1000.999)).toBe('$1,001.00');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('validateMatterClientAssociation', () => {
    it('should pass validation for valid association', () => {
      expect(() => validateMatterClientAssociation('matter-1', 'client-1')).not.toThrow();
    });

    it('should throw error for missing matter ID', () => {
      expect(() => validateMatterClientAssociation('', 'client-1')).toThrow(BillingValidationError);
      expect(() => validateMatterClientAssociation('', 'client-1')).toThrow('Matter ID is required');
    });

    it('should throw error for undefined matter ID', () => {
      expect(() => validateMatterClientAssociation(undefined, 'client-1')).toThrow(BillingValidationError);
    });

    it('should throw error for missing client ID', () => {
      expect(() => validateMatterClientAssociation('matter-1', '')).toThrow(BillingValidationError);
      expect(() => validateMatterClientAssociation('matter-1', '')).toThrow('Client ID is required');
    });

    it('should throw error for undefined client ID', () => {
      expect(() => validateMatterClientAssociation('matter-1', undefined)).toThrow(BillingValidationError);
    });

    it('should throw error for whitespace-only IDs', () => {
      expect(() => validateMatterClientAssociation('   ', 'client-1')).toThrow(BillingValidationError);
      expect(() => validateMatterClientAssociation('matter-1', '   ')).toThrow(BillingValidationError);
    });
  });
});
