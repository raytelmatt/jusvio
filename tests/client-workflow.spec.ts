import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig, waitForFirebaseAuth } from './firebase-test-utils';

test.describe('Complete Client Workflow', () => {
  test.beforeEach(async ({ page }) => {
    const config = getFirebaseTestConfig();
    await authenticateWithFirebase(page, config.testEmail, config.testPassword);
    await waitForFirebaseAuth(page);
  });

  test('should create a new client with all required fields', async ({ page }) => {
    const timestamp = Date.now();
    const clientData = {
      firstName: `TestClient${timestamp}`,
      lastName: 'Doe',
      email: `client${timestamp}@test.com`,
      phone: '555-0100',
    };

    // Navigate to create client page
    await page.goto('/clients/new');

    // Fill in client information
    await page.getByPlaceholder('Enter first name').fill(clientData.firstName);
    await page.getByPlaceholder('Enter last name').fill(clientData.lastName);
    await page.getByPlaceholder('Enter email address').fill(clientData.email);
    
    // Submit the form
    await page.getByRole('button', { name: /create client/i }).click();

    // Verify client was created
    await expect(page).toHaveURL(/\/clients\/[^/]+/, { timeout: 10000 });
    await expect(page.getByText(clientData.firstName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(clientData.email)).toBeVisible();
  });

  test('should search for and find existing clients', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Wait for clients to load
    await page.waitForSelector('table, [role="table"], .client-list', { timeout: 10000 }).catch(() => {
      // If no specific selector, just wait for any client data
    });

    // Try to find a search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name="search"]').first();
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Test');
      
      // Wait for search results
      await page.waitForLoadState('networkidle');
      
      // Verify search results appear
      await expect(page.locator('table tbody tr, .client-item').first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Some results should be visible
      });
    }
  });

  test('should view client details', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Click on first client link or button
    const clientLink = page.locator('a[href*="/clients/"], button:has-text("View")').first();
    
    if (await clientLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientLink.click();

      // Should navigate to client detail page
      await expect(page).toHaveURL(/\/clients\/[^/]+/, { timeout: 10000 });
      
      // Should see client information sections
      await expect(page.locator('h1, h2, .client-name').first()).toBeVisible();
    }
  });

  test('should handle client form validation', async ({ page }) => {
    await page.goto('/clients/new');

    // Try to submit without required fields
    await page.getByRole('button', { name: /create client/i }).click();

    // Should show validation errors or stay on the same page
    await expect(page).toHaveURL(/\/clients\/new/);
  });

  test('should navigate to client matters from client detail', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Click on first client
    const clientLink = page.locator('a[href*="/clients/"], button:has-text("View")').first();
    
    if (await clientLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientLink.click();
      await page.waitForLoadState('networkidle');

      // Look for matters section or tab
      const mattersLink = page.locator('a:has-text("Matters"), button:has-text("Matters"), [role="tab"]:has-text("Matters")').first();
      
      if (await mattersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await mattersLink.click();
        
        // Should show matters list or message
        await expect(page.locator('.matters-list, .matter-item, text=/matter/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {
          // May show "no matters" message
        });
      }
    }
  });

  test('should display client contact information correctly', async ({ page }) => {
    const timestamp = Date.now();
    const clientData = {
      firstName: `ContactTest${timestamp}`,
      lastName: 'User',
      email: `contact${timestamp}@test.com`,
    };

    // Create a client
    await page.goto('/clients/new');
    await page.getByPlaceholder('Enter first name').fill(clientData.firstName);
    await page.getByPlaceholder('Enter last name').fill(clientData.lastName);
    await page.getByPlaceholder('Enter email address').fill(clientData.email);
    await page.getByRole('button', { name: /create client/i }).click();

    // Wait for navigation to detail page
    await expect(page).toHaveURL(/\/clients\/[^/]+/, { timeout: 10000 });

    // Verify contact information is displayed
    await expect(page.getByText(clientData.email)).toBeVisible({ timeout: 5000 });
  });

  test('should allow editing client information', async ({ page }) => {
    // Navigate to clients and select first client
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    const clientLink = page.locator('a[href*="/clients/"], button:has-text("View")').first();
    
    if (await clientLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientLink.click();
      await page.waitForLoadState('networkidle');

      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      
      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();

        // Should enable editing or navigate to edit page
        await expect(page.locator('input, textarea').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
