import { test as setup, expect } from '@playwright/test';

// Firebase test credentials - these should be set via environment variables in CI/CD
const TEST_EMAIL = process.env.TEST_EMAIL || 'iahmatt@icloud.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Kb5teh04';

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
