import { test as setup, expect } from '@playwright/test';

// Firebase test credentials - must be provided via environment variables
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error('Missing TEST_EMAIL or TEST_PASSWORD env for Playwright auth setup');
}

setup('authenticate with Firebase', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for the login form to be visible
  await expect(page.locator('input[type="email"]')).toBeVisible();
  
  // Fill in credentials
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  
  // Click sign in button
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for successful authentication - look for dashboard elements
  await expect(page.getByRole('link', { name: 'Matters' })).toBeVisible({ timeout: 30000 });
  
  // Save authentication state
  await page.context().storageState({ path: 'tests/auth-state.json' });
  
  console.log('Firebase authentication setup completed successfully');
});
