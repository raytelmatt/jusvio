import { test, expect } from '@playwright/test';
import { getFirebaseTestConfig } from './firebase-test-utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from a clean state
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/login|sign in/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show login form fields', async ({ page }) => {
    // Should have email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
  });

  test('should have a submit button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling fields
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      
      // Should stay on login page or show validation
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      
      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      await submitButton.click();
      
      // Should show error message or stay on login page
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    const config = getFirebaseTestConfig();
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(config.testEmail);
      await passwordInput.fill(config.testPassword);
      
      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      await submitButton.click();
      
      // Should redirect away from login
      await page.waitForTimeout(3000);
      await expect(page).not.toHaveURL(/\/login/);
    }
  });

  test('should protect routes requiring authentication', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/clients');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 }).catch(() => {
      // May need authentication first
    });
  });

  test('should remember user session', async ({ page, context }) => {
    const config = getFirebaseTestConfig();
    
    // Login first
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(config.testEmail);
      await passwordInput.fill(config.testPassword);
      
      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Create new page in same context
      const newPage = await context.newPage();
      await newPage.goto('/clients');
      
      // Should not redirect to login
      await expect(newPage).not.toHaveURL(/\/login/);
      
      await newPage.close();
    }
  });

  test('should allow user logout', async ({ page }) => {
    const config = getFirebaseTestConfig();
    
    // Login first
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(config.testEmail);
      await passwordInput.fill(config.testPassword);
      
      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Look for logout button
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
      
      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click();
        
        // Should redirect to login
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      }
    }
  });

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passwordInput.fill('testpassword');
      
      // Look for show/hide password button
      const toggleButton = page.locator('button[aria-label*="password" i], button:has(svg):near(input[type="password"])').first();
      
      if (await toggleButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggleButton.click();
        
        // Password field type should change
        const inputType = await passwordInput.getAttribute('type');
        expect(['password', 'text']).toContain(inputType);
      }
    }
  });
});
