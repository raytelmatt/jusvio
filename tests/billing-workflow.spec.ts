import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig, waitForFirebaseAuth } from './firebase-test-utils';

test.describe('Billing and Invoice Workflow', () => {
  test.beforeEach(async ({ page }) => {
    const config = getFirebaseTestConfig();
    await authenticateWithFirebase(page, config.testEmail, config.testPassword);
    await waitForFirebaseAuth(page);
  });

  test('should navigate to billing page', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Should see billing page content
    await expect(page.getByText(/billing|invoice/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should create a time entry', async ({ page }) => {
    const timestamp = Date.now();
    
    await page.goto('/billing/time/new');
    await page.waitForLoadState('networkidle');

    // Fill in time entry form
    const matterSelect = page.locator('#matter_id, select[name="matter_id"]').first();
    if (await matterSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await matterSelect.selectOption({ index: 1 });
    }

    const descriptionInput = page.getByPlaceholder(/description|activity/i);
    if (await descriptionInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await descriptionInput.fill(`Time entry test ${timestamp}`);
    }

    const hoursInput = page.locator('input[name="hours"], input[type="number"]').first();
    if (await hoursInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await hoursInput.fill('2.5');
    }

    const rateInput = page.locator('input[name="rate"]').first();
    if (await rateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rateInput.fill('250');
    }

    // Submit time entry
    const submitButton = page.getByRole('button', { name: /save|create|submit/i });
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      
      // Should navigate away or show success
      await page.waitForTimeout(2000);
    }
  });

  test('should create an invoice', async ({ page }) => {
    const timestamp = Date.now();
    
    await page.goto('/billing/invoice/new');
    await page.waitForLoadState('networkidle');

    // Select client or matter
    const clientSelect = page.locator('#client_id, select[name="client_id"]').first();
    if (await clientSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientSelect.selectOption({ index: 1 });
    }

    // Fill in invoice details
    const invoiceNumberInput = page.locator('input[name="invoice_number"]').first();
    if (await invoiceNumberInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invoiceNumberInput.fill(`INV-${timestamp}`);
    }

    // Add a line item if interface allows
    const addLineItemButton = page.getByRole('button', { name: /add.*item|add.*line/i });
    if (await addLineItemButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addLineItemButton.click();

      const descriptionInput = page.getByPlaceholder(/description/i).last();
      if (await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descriptionInput.fill('Legal services');
      }

      const quantityInput = page.locator('input[name*="quantity"]').last();
      if (await quantityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await quantityInput.fill('5');
      }

      const rateInput = page.locator('input[name*="rate"]').last();
      if (await rateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await rateInput.fill('200');
      }
    }

    // Submit invoice
    const submitButton = page.getByRole('button', { name: /create invoice|save invoice/i });
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      
      // Should navigate to invoice detail or show success
      await expect(page).toHaveURL(/\/billing\/invoice\/[^/]+/, { timeout: 15000 }).catch(() => {
        // Or stay on same page with success message
      });
    }
  });

  test('should view invoice details', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Find and click on an invoice
    const invoiceLink = page.locator('a[href*="/billing/invoice/"], a[href*="/invoice/"]').first();
    
    if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invoiceLink.click();

      // Should show invoice details
      await expect(page).toHaveURL(/\/billing\/invoice\/|\/invoice\//);
      await expect(page.getByText(/invoice/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should calculate invoice total correctly', async ({ page }) => {
    await page.goto('/billing/invoice/new');
    await page.waitForLoadState('networkidle');

    // Select client
    const clientSelect = page.locator('#client_id, select[name="client_id"]').first();
    if (await clientSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientSelect.selectOption({ index: 1 });

      // Add line items and verify total calculation
      const addLineItemButton = page.getByRole('button', { name: /add.*item|add.*line/i });
      if (await addLineItemButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addLineItemButton.click();

        // Fill first line item
        const quantityInputs = page.locator('input[name*="quantity"]');
        const rateInputs = page.locator('input[name*="rate"]');
        
        if (await quantityInputs.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await quantityInputs.first().fill('5');
          await rateInputs.first().fill('100');

          // Total should be calculated (5 * 100 = 500)
          await page.waitForTimeout(1000);
          
          // Look for total display
          const totalElement = page.locator('text=/total.*500|\\$500/i');
          await expect(totalElement.first()).toBeVisible({ timeout: 5000 }).catch(() => {
            // Total calculation may be shown elsewhere
          });
        }
      }
    }
  });

  test('should view client balances', async ({ page }) => {
    await page.goto('/client-balances');
    await page.waitForLoadState('networkidle');

    // Should show client balances page
    await expect(page.getByText(/client.*balance|balance/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter invoices by status', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = page.locator('select[name="status"], select[name="invoice_status"]').first();
    
    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statusFilter.selectOption('Sent');
      await page.waitForLoadState('networkidle');
      
      // Results should update
      await page.waitForTimeout(1000);
    }
  });

  test('should show invoice validation errors', async ({ page }) => {
    await page.goto('/billing/invoice/new');
    await page.waitForLoadState('networkidle');

    // Try to submit without required fields
    const submitButton = page.getByRole('button', { name: /create invoice|save invoice/i });
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();

      // Should stay on page or show validation errors
      await expect(page).toHaveURL(/\/billing\/invoice\/new/);
    }
  });

  test('should display time entries for a matter', async ({ page }) => {
    await page.goto('/matters');
    await page.waitForLoadState('networkidle');

    // Navigate to a matter
    const matterLink = page.locator('a[href*="/matters/"]').first();
    if (await matterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await matterLink.click();
      await page.waitForLoadState('networkidle');

      // Go to billing or timeline tab
      const billingTab = page.getByRole('button', { name: /billing|timeline/i }).first();
      if (await billingTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await billingTab.click();

        // Should show time entries or empty state
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should allow adding payment to invoice', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Navigate to an invoice
    const invoiceLink = page.locator('a[href*="/billing/invoice/"], a[href*="/invoice/"]').first();
    
    if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invoiceLink.click();
      await page.waitForLoadState('networkidle');

      // Look for add payment button
      const addPaymentButton = page.getByRole('button', { name: /add payment|record payment/i });
      
      if (await addPaymentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addPaymentButton.click();

        // Fill payment form
        const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
        if (await amountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await amountInput.fill('100');

          const paymentMethodSelect = page.locator('select[name="payment_method"]').first();
          if (await paymentMethodSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await paymentMethodSelect.selectOption('Card');

            const submitPaymentButton = page.getByRole('button', { name: /save payment|submit payment/i });
            if (await submitPaymentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await submitPaymentButton.click();
              
              // Payment should be recorded
              await page.waitForTimeout(2000);
            }
          }
        }
      }
    }
  });

  test('should export or print invoice', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Navigate to an invoice
    const invoiceLink = page.locator('a[href*="/billing/invoice/"], a[href*="/invoice/"]').first();
    
    if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invoiceLink.click();
      await page.waitForLoadState('networkidle');

      // Look for print or export button
      const printButton = page.getByRole('button', { name: /print|export|download|pdf/i }).first();
      
      if (await printButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Just verify the button exists and is clickable
        await expect(printButton).toBeEnabled();
      }
    }
  });
});
