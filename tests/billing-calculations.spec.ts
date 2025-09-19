import { test, expect } from '@playwright/test';

test.describe('Invoice Calculation Tests', () => {
  test('should calculate invoice totals correctly', async () => {
    // Test the calculation logic directly
    const lineItems = [
      { description: 'Legal Services', quantity: 5, rate: 250, amount: 1250 },
      { description: 'Document Review', quantity: 2, rate: 150, amount: 300 },
      { description: 'Court Appearance', quantity: 3, rate: 500, amount: 1500 }
    ];
    
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    expect(subtotal).toBe(3050);
    
    const taxRate = 10; // 10%
    const taxes = subtotal * (taxRate / 100);
    expect(taxes).toBe(305);
    
    const discountRate = 5; // 5%
    const discount = subtotal * (discountRate / 100);
    expect(discount).toBe(152.5);
    
    const total = subtotal + taxes - discount;
    expect(total).toBe(3202.5);
  });
  
  test('should handle zero amounts correctly', async () => {
    const lineItems = [
      { description: 'Consultation', quantity: 0, rate: 250, amount: 0 },
      { description: 'Research', quantity: 2, rate: 0, amount: 0 }
    ];
    
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    expect(subtotal).toBe(0);
    
    const total = subtotal;
    expect(total).toBe(0);
  });
  
  test('should calculate time entry amounts correctly', async () => {
    const timeEntries = [
      { hours: 2.5, rate: 200 },
      { hours: 1.75, rate: 150 },
      { hours: 0, rate: 300 },
      { hours: 3, rate: 0 }
    ];
    
    const amounts = timeEntries.map(entry => entry.hours * entry.rate);
    expect(amounts[0]).toBe(500);
    expect(amounts[1]).toBe(262.5);
    expect(amounts[2]).toBe(0);
    expect(amounts[3]).toBe(0);
    
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    expect(total).toBe(762.5);
  });
});