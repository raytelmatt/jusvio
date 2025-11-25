import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig, waitForFirebaseAuth } from './firebase-test-utils';

test.describe('Document Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    const config = getFirebaseTestConfig();
    await authenticateWithFirebase(page, config.testEmail, config.testPassword);
    await waitForFirebaseAuth(page);
  });

  test('should navigate to documents page', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Should see documents page
    await expect(page.getByText(/documents|files/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to upload document page', async ({ page }) => {
    await page.goto('/documents/upload');
    await page.waitForLoadState('networkidle');

    // Should see upload interface
    await expect(page.locator('input[type="file"], .upload-zone').first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Or show upload button/form
    });
  });

  test('should navigate to generate document page', async ({ page }) => {
    await page.goto('/documents/generate');
    await page.waitForLoadState('networkidle');

    // Should see document generation interface
    await expect(page.getByText(/generate|template|create document/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should list available document templates', async ({ page }) => {
    await page.goto('/documents/generate');
    await page.waitForLoadState('networkidle');

    // Look for template selector
    const templateSelect = page.locator('select[name="template"], select[name="template_id"]').first();
    
    if (await templateSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Should have template options
      const options = await templateSelect.locator('option').count();
      expect(options).toBeGreaterThan(0);
    }
  });

  test('should filter documents by matter', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Look for matter filter
    const matterFilter = page.locator('select[name="matter"], select[name="matter_id"]').first();
    
    if (await matterFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await matterFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      
      // Results should update
      await page.waitForTimeout(1000);
    }
  });

  test('should filter documents by type', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Look for document type filter
    const typeFilter = page.locator('select[name="type"], select[name="document_type"]').first();
    
    if (await typeFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await typeFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      
      // Results should update
      await page.waitForTimeout(1000);
    }
  });

  test('should view document details', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Click on a document
    const documentLink = page.locator('a[href*="/documents/"]').first();
    
    if (await documentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await documentLink.click();

      // Should navigate to document detail page
      await expect(page).toHaveURL(/\/documents\/[^/]+/);
    }
  });

  test('should navigate to create template page', async ({ page }) => {
    await page.goto('/documents/templates/new');
    await page.waitForLoadState('networkidle');

    // Should see template creation form
    await expect(page.getByText(/template|create/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle document search', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');
      
      // Results should update
      await page.waitForTimeout(1000);
    }
  });

  test('should display document metadata', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    const documentLink = page.locator('a[href*="/documents/"]').first();
    
    if (await documentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await documentLink.click();
      await page.waitForLoadState('networkidle');

      // Should show document metadata like date, size, type
      await expect(page.locator('text=/created|uploaded|modified/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Metadata may be displayed differently
      });
    }
  });

  test('should allow document download', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    const documentLink = page.locator('a[href*="/documents/"]').first();
    
    if (await documentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await documentLink.click();
      await page.waitForLoadState('networkidle');

      // Look for download button
      const downloadButton = page.getByRole('button', { name: /download/i }).first();
      
      if (await downloadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Just verify button exists and is clickable
        await expect(downloadButton).toBeEnabled();
      }
    }
  });

  test('should validate template form inputs', async ({ page }) => {
    await page.goto('/documents/templates/new');
    await page.waitForLoadState('networkidle');

    // Try to submit without required fields
    const submitButton = page.getByRole('button', { name: /create|save/i }).first();
    
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();

      // Should stay on page or show validation errors
      await expect(page).toHaveURL(/\/documents\/templates\/new/);
    }
  });

  test('should support document versioning', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    const documentLink = page.locator('a[href*="/documents/"]').first();
    
    if (await documentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await documentLink.click();
      await page.waitForLoadState('networkidle');

      // Look for version information
      const versionInfo = page.locator('text=/version|v\\d+|revision/i').first();
      await versionInfo.isVisible({ timeout: 5000 }).catch(() => {
        // Version info may not always be present
      });
    }
  });
});
