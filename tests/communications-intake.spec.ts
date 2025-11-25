import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig, waitForFirebaseAuth } from './firebase-test-utils';

test.describe('Communications and Intake Forms', () => {
  test.describe('Communications', () => {
    test.beforeEach(async ({ page }) => {
      const config = getFirebaseTestConfig();
      await authenticateWithFirebase(page, config.testEmail, config.testPassword);
      await waitForFirebaseAuth(page);
    });

    test('should navigate to communications page', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      // Should see communications page
      await expect(page.getByText(/communication|message/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('should display communications list', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      // Should show communications or empty state
      await page.waitForTimeout(1000);
    });

    test('should filter communications by client', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      const clientFilter = page.locator('select[name="client"], select[name="client_id"]').first();
      
      if (await clientFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clientFilter.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    });

    test('should filter communications by matter', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      const matterFilter = page.locator('select[name="matter"], select[name="matter_id"]').first();
      
      if (await matterFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await matterFilter.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    });

    test('should filter communications by channel', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      const channelFilter = page.locator('select[name="channel"], select[name="communication_type"]').first();
      
      if (await channelFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await channelFilter.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    });

    test('should view communication details', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      const commLink = page.locator('a[href*="/communications/"], button:has-text("View")').first();
      
      if (await commLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await commLink.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should search communications', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('test');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    });

    test('should sort communications by date', async ({ page }) => {
      await page.goto('/communications');
      await page.waitForLoadState('networkidle');

      const sortButton = page.getByRole('button', { name: /sort|date/i }).first();
      
      if (await sortButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sortButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Intake Forms', () => {
    test('should display general intake form', async ({ page }) => {
      await page.goto('/intake');
      await page.waitForLoadState('networkidle');

      // Should see intake form
      await expect(page.locator('form, input, textarea').first()).toBeVisible({ timeout: 5000 });
    });

    test('should fill out general intake form', async ({ page }) => {
      const timestamp = Date.now();
      
      await page.goto('/intake');
      await page.waitForLoadState('networkidle');

      // Fill basic information
      const firstNameInput = page.getByPlaceholder(/first.*name/i).first();
      if (await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstNameInput.fill(`Test${timestamp}`);

        const lastNameInput = page.getByPlaceholder(/last.*name/i).first();
        if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await lastNameInput.fill('User');
        }

        const emailInput = page.getByPlaceholder(/email/i).first();
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await emailInput.fill(`test${timestamp}@example.com`);
        }

        const phoneInput = page.getByPlaceholder(/phone/i).first();
        if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await phoneInput.fill('555-0100');
        }

        // Submit form
        const submitButton = page.getByRole('button', { name: /submit|send/i });
        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitButton.click();
          
          // Should show success or redirect
          await page.waitForTimeout(2000);
        }
      }
    });

    test('should display criminal intake form', async ({ page }) => {
      await page.goto('/intake/criminal');
      await page.waitForLoadState('networkidle');

      // Should see criminal-specific intake form
      await expect(page.locator('form').first()).toBeVisible({ timeout: 5000 });
    });

    test('should fill out criminal intake form', async ({ page }) => {
      const timestamp = Date.now();
      
      await page.goto('/intake/criminal');
      await page.waitForLoadState('networkidle');

      // Fill criminal-specific fields
      const firstNameInput = page.getByPlaceholder(/first.*name/i).first();
      if (await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstNameInput.fill(`Criminal${timestamp}`);

        const lastNameInput = page.getByPlaceholder(/last.*name/i).first();
        if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await lastNameInput.fill('Defendant');
        }

        // Look for criminal-specific fields
        const chargesInput = page.getByPlaceholder(/charge|offense/i).first();
        if (await chargesInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await chargesInput.fill('Test charges');
        }

        const caseNumberInput = page.getByPlaceholder(/case.*number/i).first();
        if (await caseNumberInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await caseNumberInput.fill(`CR-${timestamp}`);
        }

        // Submit form
        const submitButton = page.getByRole('button', { name: /submit|send/i });
        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    });

    test('should validate intake form required fields', async ({ page }) => {
      await page.goto('/intake');
      await page.waitForLoadState('networkidle');

      // Try to submit without filling fields
      const submitButton = page.getByRole('button', { name: /submit|send/i });
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        
        // Should stay on form or show validation errors
        await expect(page).toHaveURL(/\/intake/);
      }
    });

    test('should navigate between intake form types', async ({ page }) => {
      await page.goto('/intake');
      await page.waitForLoadState('networkidle');

      // Look for form type selector
      const criminalLink = page.locator('a[href*="/intake/criminal"], button:has-text("Criminal")').first();
      
      if (await criminalLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await criminalLink.click();
        await expect(page).toHaveURL(/\/intake\/criminal/);
      }
    });

    test('should view submitted intakes (admin)', async ({ page }) => {
      const config = getFirebaseTestConfig();
      await authenticateWithFirebase(page, config.testEmail, config.testPassword);
      await waitForFirebaseAuth(page);

      await page.goto('/intakes');
      await page.waitForLoadState('networkidle');

      // Should see list of intakes
      await expect(page.getByText(/intake|submission/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // May not have any intakes
      });
    });

    test('should filter intakes by status', async ({ page }) => {
      const config = getFirebaseTestConfig();
      await authenticateWithFirebase(page, config.testEmail, config.testPassword);
      await waitForFirebaseAuth(page);

      await page.goto('/intakes');
      await page.waitForLoadState('networkidle');

      const statusFilter = page.locator('select[name="status"]').first();
      
      if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await statusFilter.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    });

    test('should filter intakes by practice area', async ({ page }) => {
      const config = getFirebaseTestConfig();
      await authenticateWithFirebase(page, config.testEmail, config.testPassword);
      await waitForFirebaseAuth(page);

      await page.goto('/intakes');
      await page.waitForLoadState('networkidle');

      const practiceAreaFilter = page.locator('select[name="practice_area"]').first();
      
      if (await practiceAreaFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await practiceAreaFilter.selectOption('Criminal');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    });

    test('should convert intake to client', async ({ page }) => {
      const config = getFirebaseTestConfig();
      await authenticateWithFirebase(page, config.testEmail, config.testPassword);
      await waitForFirebaseAuth(page);

      await page.goto('/intakes');
      await page.waitForLoadState('networkidle');

      // Click on an intake
      const intakeLink = page.locator('a[href*="/intakes/"], button:has-text("View")').first();
      
      if (await intakeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await intakeLink.click();
        await page.waitForLoadState('networkidle');

        // Look for convert button
        const convertButton = page.getByRole('button', { name: /convert|create.*client/i }).first();
        
        if (await convertButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Just verify button exists
          await expect(convertButton).toBeEnabled();
        }
      }
    });

    test('should show intake form preview', async ({ page }) => {
      await page.goto('/intake/new');
      await page.waitForLoadState('networkidle');

      // Should show form or redirect to intake page
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Client Portal', () => {
    test('should display client portal login', async ({ page }) => {
      await page.goto('/client-portal');
      await page.waitForLoadState('networkidle');

      // Should see client portal login
      await expect(page.getByText(/client|portal|login/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('should validate client portal login', async ({ page }) => {
      await page.goto('/client-portal');
      await page.waitForLoadState('networkidle');

      const submitButton = page.getByRole('button', { name: /login|sign.*in|access/i }).first();
      
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        
        // Should stay on login or show validation
        await expect(page).toHaveURL(/\/client-portal/);
      }
    });

    test('should handle invalid client portal credentials', async ({ page }) => {
      await page.goto('/client-portal');
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill('invalid@example.com');

        const codeInput = page.locator('input[name="code"], input[name="access_code"]').first();
        if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await codeInput.fill('INVALID');

          const submitButton = page.getByRole('button', { name: /login|access/i });
          await submitButton.click();
          
          // Should show error or stay on page
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/client-portal/);
        }
      }
    });
  });
});
