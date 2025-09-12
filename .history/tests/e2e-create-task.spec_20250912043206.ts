import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig } from './firebase-test-utils';

async function ensureAtLeastOneMatter(page: import('@playwright/test').Page, clientName: string, matterTitle: string) {
  // Check if any existing matters are present
  await page.getByRole('link', { name: 'Matters' }).click();
  
  // Wait for the page to load and look for matters
  await page.waitForLoadState('networkidle');
  
  // Check for existing matters with more specific selectors
  const matterLinks = page.locator('a[href*="/matters/"]').filter({ hasText: /view|open|details/i });
  const matterCount = await matterLinks.count();
  
  if (matterCount > 0) {
    await matterLinks.first().click();
    return;
  }

  // Create a client (minimal required fields)
  await page.goto('/clients/new');
  await page.getByPlaceholder('Enter first name').fill(clientName);
  await page.getByPlaceholder('Enter last name').fill('E2E');
  await page.getByRole('button', { name: /create client/i }).click();

  // Navigate to create new matter
  await page.goto('/matters/new');
  await page.locator('#client_id').selectOption({ label: `${clientName} E2E` });
  await page.getByPlaceholder('e.g., State v. Smith - DUI Defense').fill(matterTitle);
  await page.locator('#practice_area').selectOption({ label: 'Criminal Defense' });
  await page.getByRole('button', { name: /create matter/i }).click({ force: true });

  // After creation we should be at the matter detail page
  await expect(page).toHaveURL(/\/matters\//, { timeout: 30_000 });
}

test('Create a Task in a Matter', async ({ page }) => {
  const baseUrl = test.info().project.use.baseURL as string | undefined;
  expect(baseUrl, 'BASE_URL must be provided (e.g., BASE_URL=https://www.jusivo.com)').toBeTruthy();

  // Get Firebase test credentials
  const config = getFirebaseTestConfig();
  const email = config.testEmail;
  const password = config.testPassword;

  const uniqueSuffix = Date.now();
  const clientName = `E2E Client ${uniqueSuffix}`;
  const matterTitle = `E2E Matter ${uniqueSuffix}`;
  const taskTitle = `E2E Task ${uniqueSuffix}`;
  const taskDescription = `E2E task created at ${new Date(uniqueSuffix).toISOString()}`;

  // Authenticate with Firebase
  await authenticateWithFirebase(page, email, password);

  // Verify we're authenticated by checking for dashboard elements
  await expect(page.getByRole('link', { name: 'Matters' })).toBeVisible({ timeout: 30_000 });

  // Ensure there is at least one matter (or create one)
  await ensureAtLeastOneMatter(page, clientName, matterTitle);

  // Go to Tasks tab
  await page.getByRole('button', { name: /^tasks$/i }).click();

  // Add a new task
  await page.getByRole('button', { name: /add new task/i }).click();

  // Fill form in modal
  await page.getByPlaceholder('Task title').fill(taskTitle);
  await page.getByPlaceholder('Task description (optional)').fill(taskDescription);

  // Create
  const createButton = page.getByRole('button', { name: /create task/i });
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Verify task appears in list
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible({ timeout: 30_000 });
});


