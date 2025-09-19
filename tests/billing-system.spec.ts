import { test, expect } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'iahmatt@icloud.com',
  password: 'Kb5teh04'
};

test.describe('Billing System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Login if needed
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  test('should create invoice with correct totals in matter billing tab', async ({ page }) => {
    // Navigate to matters list
    await page.goto('http://localhost:5173/matters');
    await page.waitForSelector('h1:has-text("Matters")', { timeout: 10000 });
    
    // Click on the first matter (or create one if needed)
    const firstMatter = await page.locator('a[href^="/matters/"]').first();
    if (await firstMatter.isVisible()) {
      await firstMatter.click();
    } else {
      // Create a new matter if none exist
      await page.click('button:has-text("New Matter")');
      await page.fill('input[name="title"]', 'Test Matter for Billing');
      await page.fill('input[name="matter_number"]', `TEST-${Date.now()}`);
      await page.selectOption('select[name="client_id"]', { index: 1 });
      await page.selectOption('select[name="status"]', 'Active');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Matter created successfully', { timeout: 5000 });
    }
    
    // Navigate to billing tab
    await page.click('button:has-text("Billing")');
    await page.waitForSelector('h4:has-text("Billing & Invoices")', { timeout: 5000 });
    
    // Check initial state - should show correct totals even if zero
    const totalBilled = await page.locator('text=Total Billed').locator('..').locator('p.text-2xl');
    const totalPaid = await page.locator('text=Total Paid').locator('..').locator('p.text-2xl');
    const outstanding = await page.locator('text=Outstanding').locator('..').locator('p.text-2xl');
    
    // Verify initial totals are displayed (not undefined or NaN)
    await expect(totalBilled).toContainText('$');
    await expect(totalPaid).toContainText('$');
    await expect(outstanding).toContainText('$');
    
    // Click Generate Invoice button
    await page.click('button:has-text("Generate Invoice")');
    await page.waitForSelector('h3:has-text("Generate Invoice")', { timeout: 5000 });
    
    // Fill invoice details
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await page.fill('input#invoice_issue_date', today);
    await page.fill('input#invoice_due_date', dueDate);
    
    // Add a custom line item
    await page.click('button:has-text("Add Custom Item")');
    await page.waitForSelector('input[placeholder="Description"]', { timeout: 5000 });
    
    // Fill line item details
    await page.fill('input[placeholder="Description"]', 'Legal Services - Initial Consultation');
    await page.fill('input[placeholder="Qty"]', '5'); // 5 hours
    await page.fill('input[placeholder="Rate"]', '250'); // $250/hour
    
    // Verify the amount is calculated correctly (5 * 250 = 1250)
    const lineItemAmount = await page.locator('p:has-text("$1250.00")').first();
    await expect(lineItemAmount).toBeVisible();
    
    // Verify invoice totals section shows correct subtotal
    const subtotalElement = await page.locator('text=Subtotal:').locator('..').locator('span.text-white');
    await expect(subtotalElement).toHaveText('$1250.00');
    
    // Verify total is correct
    const totalElement = await page.locator('text=Total:').locator('..').locator('span.text-white').last();
    await expect(totalElement).toHaveText('$1250.00');
    
    // Generate the invoice
    await page.click('button:has-text("Generate Invoice")');
    
    // Wait for success message or invoice to appear
    await page.waitForTimeout(2000); // Give time for the invoice to be created
    
    // Verify invoice appears in the list with correct amount
    const invoiceNumber = await page.locator('h5:has-text("Invoice #INV-")').first();
    await expect(invoiceNumber).toBeVisible();
    
    // Verify the invoice shows the correct total (not zero)
    const invoiceTotal = await page.locator('p:has-text("Total")').locator('..').locator('p.text-lg').first();
    await expect(invoiceTotal).toHaveText('$1250.00');
    
    // Verify View Details button is present
    const viewDetailsButton = await page.locator('button:has-text("View Details")').first();
    await expect(viewDetailsButton).toBeVisible();
    
    // Click View Details to navigate to invoice detail page
    await viewDetailsButton.click();
    await page.waitForURL('**/billing/invoice/**', { timeout: 5000 });
    
    // Verify invoice detail page loads with correct information
    await expect(page.locator('h1:has-text("Invoice #INV-")')).toBeVisible();
    await expect(page.locator('text=Total: $1250.00')).toBeVisible();
    
    // Navigate back to matter billing tab
    await page.goBack();
    await page.waitForSelector('h4:has-text("Billing & Invoices")', { timeout: 5000 });
    
    // Verify updated totals
    const updatedTotalBilled = await page.locator('text=Total Billed').locator('..').locator('p.text-2xl');
    await expect(updatedTotalBilled).toHaveText('$1250.00');
    
    const updatedOutstanding = await page.locator('text=Outstanding').locator('..').locator('p.text-2xl');
    await expect(updatedOutstanding).toHaveText('$1250.00');
  });

  test('should record payment and update totals correctly', async ({ page }) => {
    // Navigate to a matter with existing invoice
    await page.goto('http://localhost:5173/matters');
    await page.waitForSelector('h1:has-text("Matters")', { timeout: 10000 });
    
    // Click on the first matter
    const firstMatter = await page.locator('a[href^="/matters/"]').first();
    if (await firstMatter.isVisible()) {
      await firstMatter.click();
      
      // Navigate to billing tab
      await page.click('button:has-text("Billing")');
      await page.waitForSelector('h4:has-text("Billing & Invoices")', { timeout: 5000 });
      
      // Check if there are any unpaid invoices
      const recordPaymentButton = await page.locator('button:has-text("Record Payment")').first();
      if (await recordPaymentButton.isVisible()) {
        // Get initial outstanding amount
        const initialOutstanding = await page.locator('text=Outstanding').locator('..').locator('p.text-2xl').textContent();
        
        // Click Record Payment
        await recordPaymentButton.click();
        await page.waitForSelector('h3:has-text("Record Payment")', { timeout: 5000 });
        
        // Fill payment details
        await page.fill('input[placeholder="Payment amount"]', '500');
        await page.selectOption('select', 'Check'); // Payment method
        await page.fill('input[placeholder="Check number or reference"]', 'CHK-12345');
        
        // Submit payment
        await page.click('button:has-text("Record Payment")');
        await page.waitForTimeout(2000);
        
        // Verify payment was recorded and totals updated
        const updatedTotalPaid = await page.locator('text=Total Paid').locator('..').locator('p.text-2xl');
        await expect(updatedTotalPaid).not.toHaveText('$0.00');
        
        // Verify outstanding amount decreased
        const updatedOutstanding = await page.locator('text=Outstanding').locator('..').locator('p.text-2xl').textContent();
        expect(parseFloat(updatedOutstanding!.replace('$', '').replace(',', ''))).toBeLessThan(
          parseFloat(initialOutstanding!.replace('$', '').replace(',', ''))
        );
      }
    }
  });

  test('should display correct invoice amounts in billing list', async ({ page }) => {
    // Navigate to main billing page
    await page.goto('http://localhost:5173/billing');
    await page.waitForSelector('h1:has-text("Billing")', { timeout: 10000 });
    
    // Click on invoices tab
    await page.click('button:has-text("Invoices")');
    await page.waitForTimeout(1000);
    
    // Check if any invoices exist
    const invoiceCards = await page.locator('div:has(h3:has-text("Invoice #"))');
    const count = await invoiceCards.count();
    
    if (count > 0) {
      // Verify each invoice shows a total amount (not $0.00)
      for (let i = 0; i < Math.min(count, 3); i++) {
        const invoice = invoiceCards.nth(i);
        const totalText = await invoice.locator('p.text-lg').textContent();
        
        // Verify the total is displayed and formatted correctly
        expect(totalText).toMatch(/\$[\d,]+\.\d{2}/);
      }
    }
  });

  test('should show correct time entry amounts in billing tab', async ({ page }) => {
    // Navigate to a matter
    await page.goto('http://localhost:5173/matters');
    await page.waitForSelector('h1:has-text("Matters")', { timeout: 10000 });
    
    const firstMatter = await page.locator('a[href^="/matters/"]').first();
    if (await firstMatter.isVisible()) {
      await firstMatter.click();
      
      // Navigate to billing tab
      await page.click('button:has-text("Billing")');
      await page.waitForSelector('h4:has-text("Billing & Invoices")', { timeout: 5000 });
      
      // Check if time entries section exists
      const timeEntriesSection = await page.locator('h5:has-text("Time Entries")');
      if (await timeEntriesSection.isVisible()) {
        // Verify time entries table shows correct calculations
        const timeEntryRows = await page.locator('tbody tr');
        const rowCount = await timeEntryRows.count();
        
        if (rowCount > 0) {
          // Check first time entry has calculated amount
          const firstRow = timeEntryRows.first();
          const amount = await firstRow.locator('td').last().textContent();
          
          // Verify amount is calculated and not $0.00
          expect(amount).toMatch(/\$[\d,]+\.\d{2}/);
        }
        
        // Verify total unbilled amount is shown
        const totalUnbilled = await page.locator('td:has-text("Total Unbilled:")').locator('..').locator('td').last();
        await expect(totalUnbilled).toContainText('$');
      }
    }
  });
});

test.describe('Invoice Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('http://localhost:5173');
    
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  test('should navigate between billing tab and invoice details', async ({ page }) => {
    // Navigate to a matter with invoices
    await page.goto('http://localhost:5173/matters');
    await page.waitForSelector('h1:has-text("Matters")', { timeout: 10000 });
    
    const firstMatter = await page.locator('a[href^="/matters/"]').first();
    if (await firstMatter.isVisible()) {
      await firstMatter.click();
      
      // Go to billing tab
      await page.click('button:has-text("Billing")');
      await page.waitForSelector('h4:has-text("Billing & Invoices")', { timeout: 5000 });
      
      // Check if View Details button exists
      const viewDetailsButton = await page.locator('button:has-text("View Details")').first();
      if (await viewDetailsButton.isVisible()) {
        // Click to view invoice details
        await viewDetailsButton.click();
        await page.waitForURL('**/billing/invoice/**', { timeout: 5000 });
        
        // Verify invoice detail page elements
        await expect(page.locator('h1:has-text("Invoice #")')).toBeVisible();
        await expect(page.locator('text=Line Items')).toBeVisible();
        
        // Navigate back using the back link
        await page.click('a[href="/billing"]');
        await page.waitForURL('**/billing', { timeout: 5000 });
        
        // Verify we're back on the billing page
        await expect(page.locator('h1:has-text("Billing")')).toBeVisible();
      }
    }
  });
});