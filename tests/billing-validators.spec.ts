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
} from '../src/react-app/lib/billing-validators';

describe('Billing Validators', () => {
  describe('validateLineItem', () => {
    it('should validate a correct line item', () => {
      const item: LineItem = {
        description: 'Legal consultation',
        quantity: 2,
        rate: 150,
        amount: 300,
      };
      expect(() => validateLineItem(item)).not.toThrow();
    });

    it('should throw error for missing description', () => {
      const item: LineItem = {
        description: '',
        quantity: 2,
        rate: 150,
        amount: 300,
      };
      expect(() => validateLineItem(item)).toThrow(BillingValidationError);
      expect(() => validateLineItem(item)).toThrow('description is required');
    });

    it('should throw error for negative quantity', () => {
      const item: LineItem = {
        description: 'Test',
        quantity: -2,
        rate: 150,
        amount: -300,
      };
      expect(() => validateLineItem(item)).toThrow(BillingValidationError);
      expect(() => validateLineItem(item)).toThrow('quantity cannot be negative');
    });

    it('should throw error for negative rate', () => {
      const item: LineItem = {
        description: 'Test',
        quantity: 2,
        rate: -150,
        amount: -300,
      };
      expect(() => validateLineItem(item)).toThrow(BillingValidationError);
      expect(() => validateLineItem(item)).toThrow('rate cannot be negative');
    });

    it('should throw error for amount mismatch', () => {
      const item: LineItem = {
        description: 'Test',
        quantity: 2,
        rate: 150,
        amount: 500, // Should be 300
      };
      expect(() => validateLineItem(item)).toThrow(BillingValidationError);
      expect(() => validateLineItem(item)).toThrow('does not match');
    });

    it('should handle zero quantity', () => {
      const item: LineItem = {
        description: 'Test',
        quantity: 0,
        rate: 150,
        amount: 0,
      };
      expect(() => validateLineItem(item)).not.toThrow();
    });

    it('should allow small floating point differences', () => {
      const item: LineItem = {
        description: 'Test',
        quantity: 2.5,
        rate: 150.33,
        amount: 375.825, // Exact: 375.825
      };
      expect(() => validateLineItem(item)).not.toThrow();
    });
  });

  describe('validateInvoice', () => {
    it('should validate a correct invoice', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 330,
        subtotal: 300,
        taxes: 30,
        discounts: 0,
        status: 'Draft',
        line_items: [
          { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
        ],
      };
      expect(() => validateInvoice(invoice)).not.toThrow();
    });

    it('should validate invoice with string line_items', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 300,
        subtotal: 300,
        status: 'Draft',
        line_items: JSON.stringify([
          { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
        ]),
      };
      expect(() => validateInvoice(invoice)).not.toThrow();
    });

    it('should throw error for negative total', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: -100,
        status: 'Draft',
        line_items: [],
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('cannot be negative');
    });

    it('should throw error for subtotal mismatch', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 500,
        subtotal: 500, // Should be 300
        status: 'Draft',
        line_items: [
          { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
        ],
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('does not match sum of line items');
    });

    it('should throw error for total calculation mismatch', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 500, // Should be 330
        subtotal: 300,
        taxes: 30,
        discounts: 0,
        status: 'Draft',
        line_items: [
          { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
        ],
      };
      expect(() => validateInvoice(invoice)).toThrow(BillingValidationError);
      expect(() => validateInvoice(invoice)).toThrow('does not match calculated total');
    });

    it('should validate invoice with taxes and discounts', () => {
      const invoice: Invoice = {
        invoice_number: 'INV-001',
        total: 315, // 300 + 30 - 15
        subtotal: 300,
        taxes: 30,
        discounts: 15,
        status: 'Draft',
        line_items: [
          { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
        ],
      };
      expect(() => validateInvoice(invoice)).not.toThrow();
    });
  });

  describe('validatePayment', () => {
    const invoice: Invoice = {
      invoice_number: 'INV-001',
      total: 1000,
      status: 'Sent',
    };

    it('should validate a correct payment', () => {
      const payment: Payment = {
        invoice_id: 'inv123',
        amount: 500,
        payment_method: 'Check',
        reference: 'CHK-001',
      };
      expect(() => validatePayment(payment, invoice, [])).not.toThrow();
    });

    it('should throw error for zero payment', () => {
      const payment: Payment = {
        invoice_id: 'inv123',
        amount: 0,
        payment_method: 'Check',
      };
      expect(() => validatePayment(payment, invoice, [])).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, invoice, [])).toThrow('must be greater than zero');
    });

    it('should throw error for negative payment', () => {
      const payment: Payment = {
        invoice_id: 'inv123',
        amount: -100,
        payment_method: 'Check',
      };
      expect(() => validatePayment(payment, invoice, [])).toThrow(BillingValidationError);
    });

    it('should throw error for overpayment', () => {
      const payment: Payment = {
        invoice_id: 'inv123',
        amount: 600,
        payment_method: 'Check',
      };
      const existingPayments: Payment[] = [
        { invoice_id: 'inv123', amount: 500, payment_method: 'Card' },
      ];
      expect(() => validatePayment(payment, invoice, existingPayments)).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, invoice, existingPayments)).toThrow('exceeds remaining balance');
    });

    it('should allow full payment', () => {
      const payment: Payment = {
        invoice_id: 'inv123',
        amount: 500,
        payment_method: 'Check',
      };
      const existingPayments: Payment[] = [
        { invoice_id: 'inv123', amount: 500, payment_method: 'Card' },
      ];
      expect(() => validatePayment(payment, invoice, existingPayments)).not.toThrow();
    });

    it('should throw error for invalid payment method', () => {
      const payment: Payment = {
        invoice_id: 'inv123',
        amount: 500,
        payment_method: 'Bitcoin', // Not a valid method
      };
      expect(() => validatePayment(payment, invoice, [])).toThrow(BillingValidationError);
      expect(() => validatePayment(payment, invoice, [])).toThrow('Invalid payment method');
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('should calculate total correctly', () => {
      const lineItems: LineItem[] = [
        { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
        { description: 'Item 2', quantity: 1, rate: 200, amount: 200 },
      ];
      const result = calculateInvoiceTotal(lineItems, 10, 5);
      
      expect(result.subtotal).toBe(500);
      expect(result.taxes).toBe(50); // 10% of 500
      expect(result.discounts).toBe(25); // 5% of 500
      expect(result.total).toBe(525); // 500 + 50 - 25
    });

    it('should calculate total with no taxes or discounts', () => {
      const lineItems: LineItem[] = [
        { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
      ];
      const result = calculateInvoiceTotal(lineItems);
      
      expect(result.subtotal).toBe(300);
      expect(result.taxes).toBe(0);
      expect(result.discounts).toBe(0);
      expect(result.total).toBe(300);
    });

    it('should handle empty line items', () => {
      const lineItems: LineItem[] = [];
      const result = calculateInvoiceTotal(lineItems);
      
      expect(result.subtotal).toBe(0);
      expect(result.taxes).toBe(0);
      expect(result.discounts).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should throw error for invalid tax rate', () => {
      const lineItems: LineItem[] = [
        { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
      ];
      expect(() => calculateInvoiceTotal(lineItems, -5, 0)).toThrow(BillingValidationError);
      expect(() => calculateInvoiceTotal(lineItems, 150, 0)).toThrow(BillingValidationError);
    });

    it('should throw error for invalid discount rate', () => {
      const lineItems: LineItem[] = [
        { description: 'Item 1', quantity: 2, rate: 150, amount: 300 },
      ];
      expect(() => calculateInvoiceTotal(lineItems, 0, -5)).toThrow(BillingValidationError);
      expect(() => calculateInvoiceTotal(lineItems, 0, 150)).toThrow(BillingValidationError);
    });

    it('should round to 2 decimal places', () => {
      const lineItems: LineItem[] = [
        { description: 'Item 1', quantity: 3, rate: 10.33, amount: 30.99 },
      ];
      const result = calculateInvoiceTotal(lineItems, 7.5, 0);
      
      // 30.99 + (30.99 * 0.075) = 30.99 + 2.32425 = 33.31425 → 33.31
      expect(result.total).toBe(33.31);
    });
  });

  describe('normalizeId', () => {
    it('should normalize id field', () => {
      expect(normalizeId({ id: '123' })).toBe('123');
      expect(normalizeId({ id: 123 })).toBe('123');
    });

    it('should normalize $id field', () => {
      expect(normalizeId({ $id: '456' })).toBe('456');
      expect(normalizeId({ $id: 456 })).toBe('456');
    });

    it('should prioritize id over $id', () => {
      expect(normalizeId({ id: '123', $id: '456' })).toBe('123');
    });

    it('should throw error for missing id', () => {
      expect(() => normalizeId({})).toThrow(BillingValidationError);
      expect(() => normalizeId({ name: 'test' })).toThrow(BillingValidationError);
    });
  });

  describe('getNumericValue', () => {
    it('should return numeric value', () => {
      expect(getNumericValue(123)).toBe(123);
      expect(getNumericValue(0)).toBe(0);
      expect(getNumericValue(-50)).toBe(-50);
    });

    it('should parse string numbers', () => {
      expect(getNumericValue('123')).toBe(123);
      expect(getNumericValue('123.45')).toBe(123.45);
    });

    it('should return fallback for invalid values', () => {
      expect(getNumericValue('abc')).toBe(0);
      expect(getNumericValue(null)).toBe(0);
      expect(getNumericValue(undefined)).toBe(0);
      expect(getNumericValue(NaN)).toBe(0);
    });

    it('should use custom fallback', () => {
      expect(getNumericValue('abc', 100)).toBe(100);
      expect(getNumericValue(null, -1)).toBe(-1);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500.50)).toBe('-$500.50');
    });

    it('should handle decimal places', () => {
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(10.005)).toBe('$10.01'); // Rounds up
    });
  });

  describe('validateMatterClientAssociation', () => {
    it('should validate correct association', () => {
      expect(() => validateMatterClientAssociation('matter123', 'client456')).not.toThrow();
    });

    it('should throw error for missing matter ID', () => {
      expect(() => validateMatterClientAssociation('', 'client456')).toThrow(BillingValidationError);
      expect(() => validateMatterClientAssociation(undefined, 'client456')).toThrow(BillingValidationError);
    });

    it('should throw error for missing client ID', () => {
      expect(() => validateMatterClientAssociation('matter123', '')).toThrow(BillingValidationError);
      expect(() => validateMatterClientAssociation('matter123', undefined)).toThrow(BillingValidationError);
    });

    it('should throw error for whitespace-only IDs', () => {
      expect(() => validateMatterClientAssociation('   ', 'client456')).toThrow(BillingValidationError);
      expect(() => validateMatterClientAssociation('matter123', '   ')).toThrow(BillingValidationError);
    });
  });
});
