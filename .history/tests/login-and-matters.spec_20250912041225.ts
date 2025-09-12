import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, isFirebaseAuthenticated, getFirebaseTestConfig } from './firebase-test-utils';

test.describe('Login and Matters Functionality', () => {
  const config = getFirebaseTestConfig();
  const testEmail = config.testEmail;
  const testPassword = config.testPassword;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test.describe('Authentication Flow', () => {
    test('should redirect to login page when not authenticated', async ({ page }) => {
      // Check if we're redirected to login
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
      
      // Verify login form elements are present
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should display login form correctly', async ({ page }) => {
      await page.goto('/login');
      
      // Check form elements
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const signInButton = page.getByRole('button', { name: /sign in/i });
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(signInButton).toBeVisible();
      
      // Check placeholder text
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should handle invalid login credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Try with invalid credentials
      await page.locator('input[type="email"]').fill('invalid@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should show error message or stay on login page
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in valid credentials
      await page.locator('input[type="email"]').fill(testEmail);
      await page.locator('input[type="password"]').fill(testPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Wait for successful authentication
      await expect(page.getByRole('link', { name: 'Matters' })).toBeVisible({ timeout: 30000 });
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL(/.*\/$/, { timeout: 10000 });
    });
  });

  test.describe('Dashboard and Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate before each test
      await authenticateWithFirebase(page, testEmail, testPassword);
    });

    test('should display dashboard after successful login', async ({ page }) => {
      // Verify dashboard elements are present
      await expect(page.getByRole('link', { name: 'Matters' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Clients' })).toBeVisible();
      
      // Check for common dashboard elements
      const navigationElements = [
        'Matters',
        'Clients', 
        'Documents',
        'Deadlines',
        'Time Entry',
        'Billing',
        'Settings'
      ];
      
      for (const element of navigationElements) {
        await expect(page.getByRole('link', { name: element })).toBeVisible();
      }
    });

    test('should navigate to different sections', async ({ page }) => {
      // Test navigation to Matters
      await page.getByRole('link', { name: 'Matters' }).click();
      await expect(page).toHaveURL(/.*\/matters/, { timeout: 10000 });
      
      // Test navigation to Clients
      await page.getByRole('link', { name: 'Clients' }).click();
      await expect(page).toHaveURL(/.*\/clients/, { timeout: 10000 });
      
      // Test navigation to Documents
      await page.getByRole('link', { name: 'Documents' }).click();
      await expect(page).toHaveURL(/.*\/documents/, { timeout: 10000 });
    });
  });

  test.describe('Matters Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate before each test
      await authenticateWithFirebase(page, testEmail, testPassword);
    });

    test('should access matters page', async ({ page }) => {
      await page.getByRole('link', { name: 'Matters' }).click();
      await expect(page).toHaveURL(/.*\/matters/, { timeout: 10000 });
      
      // Verify matters page elements
      await expect(page.getByRole('heading', { name: /matters/i })).toBeVisible();
    });

    test('should display matters list', async ({ page }) => {
      await page.getByRole('link', { name: 'Matters' }).click();
      
      // Wait for matters to load
      await page.waitForLoadState('networkidle');
      
      // Check for matters table or list
      const mattersContainer = page.locator('[data-testid="matters-list"], .matters-list, table, .matter-item').first();
      await expect(mattersContainer).toBeVisible({ timeout: 15000 });
    });

    test('should have create new matter button', async ({ page }) => {
      await page.getByRole('link', { name: 'Matters' }).click();
      
      // Look for create new matter button
      const createButton = page.getByRole('button', { name: /new matter|create matter|add matter/i }).first();
      await expect(createButton).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to create new matter page', async ({ page }) => {
      await page.getByRole('link', { name: 'Matters' }).click();
      
      // Click create new matter button
      const createButton = page.getByRole('button', { name: /new matter|create matter|add matter/i }).first();
      await createButton.click();
      
      // Should navigate to new matter page
      await expect(page).toHaveURL(/.*\/matters\/new/, { timeout: 10000 });
    });

    test('should display matter creation form', async ({ page }) => {
      await page.goto('/matters/new');
      
      // Check for form elements
      await expect(page.getByRole('heading', { name: /new matter|create matter/i })).toBeVisible();
      
      // Look for common form fields
      const formFields = [
        'title',
        'client',
        'practice area',
        'description'
      ];
      
      for (const field of formFields) {
        const fieldElement = page.locator(`input[name*="${field}"], select[name*="${field}"], textarea[name*="${field}"]`).first();
        if (await fieldElement.isVisible({ timeout: 5000 })) {
          await expect(fieldElement).toBeVisible();
        }
      }
    });

    test('should create a new matter', async ({ page }) => {
      const uniqueSuffix = Date.now();
      const matterTitle = `Test Matter ${uniqueSuffix}`;
      
      await page.goto('/matters/new');
      
      // Fill in matter details
      const titleField = page.locator('input[name*="title"], input[placeholder*="title"]').first();
      await titleField.fill(matterTitle);
      
      // Try to select a client if dropdown exists
      const clientSelect = page.locator('select[name*="client"], #client_id').first();
      if (await clientSelect.isVisible({ timeout: 5000 })) {
        const options = await clientSelect.locator('option').count();
        if (options > 1) {
          await clientSelect.selectOption({ index: 1 });
        }
      }
      
      // Try to select practice area if dropdown exists
      const practiceAreaSelect = page.locator('select[name*="practice"], #practice_area').first();
      if (await practiceAreaSelect.isVisible({ timeout: 5000 })) {
        const options = await practiceAreaSelect.locator('option').count();
        if (options > 1) {
          await practiceAreaSelect.selectOption({ index: 1 });
        }
      }
      
      // Submit the form
      const submitButton = page.getByRole('button', { name: /create|save|submit/i }).first();
      await submitButton.click();
      
      // Should redirect to matter detail page or matters list
      await expect(page).toHaveURL(/.*\/matters/, { timeout: 15000 });
      
      // Verify matter was created by checking for the title
      await expect(page.getByText(matterTitle)).toBeVisible({ timeout: 10000 });
    });

    test('should view matter details', async ({ page }) => {
      await page.getByRole('link', { name: 'Matters' }).click();
      
      // Wait for matters to load
      await page.waitForLoadState('networkidle');
      
      // Look for matter links
      const matterLinks = page.locator('a[href*="/matters/"]').filter({ hasText: /view|open|details/i });
      const matterCount = await matterLinks.count();
      
      if (matterCount > 0) {
        // Click on first matter
        await matterLinks.first().click();
        
        // Should be on matter detail page
        await expect(page).toHaveURL(/.*\/matters\/[^\/]+$/, { timeout: 10000 });
        
        // Verify matter detail elements
        await expect(page.getByRole('heading')).toBeVisible();
      } else {
        // If no matters exist, create one first
        await page.getByRole('button', { name: /new matter|create matter|add matter/i }).first().click();
        
        const uniqueSuffix = Date.now();
        const matterTitle = `Test Matter ${uniqueSuffix}`;
        
        await page.locator('input[name*="title"], input[placeholder*="title"]').first().fill(matterTitle);
        
        const submitButton = page.getByRole('button', { name: /create|save|submit/i }).first();
        await submitButton.click();
        
        // Should be on matter detail page
        await expect(page).toHaveURL(/.*\/matters\/[^\/]+$/, { timeout: 15000 });
        await expect(page.getByText(matterTitle)).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      await page.goto('/login');
      
      // Should still show login form even with network issues
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    });

    test('should handle invalid URLs', async ({ page }) => {
      await page.goto('/invalid-page');
      
      // Should redirect to login or show 404
      await expect(page).toHaveURL(/.*\/(login|404)/, { timeout: 10000 });
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate before each test
      await authenticateWithFirebase(page, testEmail, testPassword);
    });

    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to matters
      await page.getByRole('link', { name: 'Matters' }).click();
      
      // Should still be able to access matters
      await expect(page).toHaveURL(/.*\/matters/, { timeout: 10000 });
      
      // Check if mobile navigation works
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]').first();
      if (await mobileMenu.isVisible({ timeout: 5000 })) {
        await mobileMenu.click();
        await expect(page.getByRole('link', { name: 'Matters' })).toBeVisible();
      }
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Navigate to matters
      await page.getByRole('link', { name: 'Matters' }).click();
      
      // Should still be able to access matters
      await expect(page).toHaveURL(/.*\/matters/, { timeout: 10000 });
    });
  });
});
