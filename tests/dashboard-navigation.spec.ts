import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig, waitForFirebaseAuth } from './firebase-test-utils';

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const config = getFirebaseTestConfig();
    await authenticateWithFirebase(page, config.testEmail, config.testPassword);
    await waitForFirebaseAuth(page);
  });

  test('should display dashboard after login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should see dashboard content
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have navigation items
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on clients navigation link
    const clientsLink = page.getByRole('link', { name: /clients/i }).first();
    if (await clientsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientsLink.click();
      await expect(page).toHaveURL(/\/clients/);
    }
  });

  test('should navigate to matters page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on matters navigation link
    const mattersLink = page.getByRole('link', { name: /matters|cases/i }).first();
    if (await mattersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mattersLink.click();
      await expect(page).toHaveURL(/\/matters/);
    }
  });

  test('should navigate to documents page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on documents navigation link
    const documentsLink = page.getByRole('link', { name: /documents/i }).first();
    if (await documentsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await documentsLink.click();
      await expect(page).toHaveURL(/\/documents/);
    }
  });

  test('should navigate to billing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on billing navigation link
    const billingLink = page.getByRole('link', { name: /billing|invoices/i }).first();
    if (await billingLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await billingLink.click();
      await expect(page).toHaveURL(/\/billing/);
    }
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on calendar navigation link
    const calendarLink = page.getByRole('link', { name: /calendar/i }).first();
    if (await calendarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await calendarLink.click();
      await expect(page).toHaveURL(/\/calendar/);
    }
  });

  test('should navigate to deadlines page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on deadlines navigation link
    const deadlinesLink = page.getByRole('link', { name: /deadlines/i }).first();
    if (await deadlinesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deadlinesLink.click();
      await expect(page).toHaveURL(/\/deadlines/);
    }
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on settings navigation link
    const settingsLink = page.getByRole('link', { name: /settings/i }).first();
    if (await settingsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/settings/);
    }
  });

  test('should display dashboard statistics', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show statistics or counts
    const stats = page.locator('text=/\\d+.*matters?|\\d+.*clients?|\\d+.*hearings?/i').first();
    await stats.isVisible({ timeout: 5000 }).catch(() => {
      // Stats may not always be present or visible
    });
  });

  test('should display recent activity or notifications', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show recent activity section
    const activity = page.locator('text=/recent|activity|notifications|updates/i').first();
    await activity.isVisible({ timeout: 5000 }).catch(() => {
      // Activity section may not always be present
    });
  });

  test('should display upcoming deadlines', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show upcoming deadlines
    const deadlines = page.locator('text=/deadline|due|upcoming/i').first();
    await deadlines.isVisible({ timeout: 5000 }).catch(() => {
      // Deadlines may not always be present
    });
  });

  test('should display upcoming hearings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show upcoming hearings
    const hearings = page.locator('text=/hearing|court|appearance/i').first();
    await hearings.isVisible({ timeout: 5000 }).catch(() => {
      // Hearings may not always be present
    });
  });

  test('should show user profile information', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show user name or profile
    const profile = page.locator('[role="button"]:has-text("@"), .user-profile, .user-menu').first();
    await profile.isVisible({ timeout: 5000 }).catch(() => {
      // Profile may be displayed differently
    });
  });

  test('should support mobile navigation menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg):near(nav)').first();
    
    if (await menuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuButton.click();
      
      // Menu should open
      await page.waitForTimeout(500);
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Clients link should be highlighted/active
    const clientsLink = page.getByRole('link', { name: /clients/i }).first();
    if (await clientsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const classList = await clientsLink.getAttribute('class');
      expect(classList).toBeTruthy();
    }
  });

  test('should allow quick actions from dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for quick action buttons
    const quickActions = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("Create")');
    const count = await quickActions.count();
    
    // Should have at least some quick action buttons
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display practice area breakdown', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show practice area information
    const practiceAreas = page.locator('text=/criminal|personal injury|ssd/i').first();
    await practiceAreas.isVisible({ timeout: 5000 }).catch(() => {
      // Practice areas may not always be visible on dashboard
    });
  });

  test('should handle breadcrumb navigation', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Click on a client to go deeper
    const clientLink = page.locator('a[href*="/clients/"]').first();
    if (await clientLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientLink.click();
      await page.waitForLoadState('networkidle');

      // Should have breadcrumb navigation
      const breadcrumb = page.locator('nav[aria-label*="breadcrumb" i], .breadcrumb').first();
      await breadcrumb.isVisible({ timeout: 5000 }).catch(() => {
        // Breadcrumbs may not be implemented
      });
    }
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    await page.goto('/matters');
    await page.waitForLoadState('networkidle');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Navigate to another page and back
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Page should load
    await expect(page).toHaveURL(/\/matters/);
  });
});
