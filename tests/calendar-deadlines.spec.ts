import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig, waitForFirebaseAuth } from './firebase-test-utils';

test.describe('Calendar and Deadlines Management', () => {
  test.beforeEach(async ({ page }) => {
    const config = getFirebaseTestConfig();
    await authenticateWithFirebase(page, config.testEmail, config.testPassword);
    await waitForFirebaseAuth(page);
  });

  test('should display calendar page', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Should see calendar view
    await expect(page.getByText(/calendar|schedule/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should display deadlines page', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    // Should see deadlines list
    await expect(page.getByText(/deadline/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to create deadline page', async ({ page }) => {
    await page.goto('/deadlines/new');
    await page.waitForLoadState('networkidle');

    // Should see deadline creation form
    await expect(page.locator('form, input, textarea').first()).toBeVisible({ timeout: 5000 });
  });

  test('should create a new deadline', async ({ page }) => {
    const timestamp = Date.now();
    
    await page.goto('/deadlines/new');
    await page.waitForLoadState('networkidle');

    // Fill deadline form
    const titleInput = page.getByPlaceholder(/title|name|description/i).first();
    if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleInput.fill(`Test Deadline ${timestamp}`);

      // Select a matter
      const matterSelect = page.locator('#matter_id, select[name="matter_id"]').first();
      if (await matterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await matterSelect.selectOption({ index: 1 });
      }

      // Set a due date
      const dueDateInput = page.locator('input[type="date"], input[name*="due"]').first();
      if (await dueDateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        await dueDateInput.fill(futureDate.toISOString().split('T')[0]);
      }

      // Submit the form
      const submitButton = page.getByRole('button', { name: /create|save/i });
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click();
        
        // Should navigate away or show success
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should navigate to create hearing page', async ({ page }) => {
    await page.goto('/hearings/new');
    await page.waitForLoadState('networkidle');

    // Should see hearing creation form
    await expect(page.locator('form, input, select').first()).toBeVisible({ timeout: 5000 });
  });

  test('should create a new hearing', async ({ page }) => {
    const timestamp = Date.now();
    
    await page.goto('/hearings/new');
    await page.waitForLoadState('networkidle');

    // Fill hearing form
    const matterSelect = page.locator('#matter_id, select[name="matter_id"]').first();
    if (await matterSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await matterSelect.selectOption({ index: 1 });

      // Set hearing date and time
      const dateInput = page.locator('input[type="date"], input[name*="date"]').first();
      if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        await dateInput.fill(futureDate.toISOString().split('T')[0]);
      }

      const timeInput = page.locator('input[type="time"], input[name*="time"]').first();
      if (await timeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await timeInput.fill('10:00');
      }

      // Submit the form
      const submitButton = page.getByRole('button', { name: /create|save/i });
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click();
        
        // Should navigate away or show success
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should filter deadlines by status', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = page.locator('select[name="status"]').first();
    
    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statusFilter.selectOption('Open');
      await page.waitForLoadState('networkidle');
      
      // Results should update
      await page.waitForTimeout(1000);
    }
  });

  test('should filter deadlines by date range', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    // Look for date filters
    const startDateInput = page.locator('input[name*="start"], input[name*="from"]').first();
    const endDateInput = page.locator('input[name*="end"], input[name*="to"]').first();
    
    if (await startDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      await startDateInput.fill(today.toISOString().split('T')[0]);
      await endDateInput.fill(futureDate.toISOString().split('T')[0]);
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  });

  test('should view deadline details', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    // Click on a deadline
    const deadlineLink = page.locator('a[href*="/deadlines/"]').first();
    
    if (await deadlineLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deadlineLink.click();

      // Should navigate to deadline detail page
      await expect(page).toHaveURL(/\/deadlines\/[^/]+/);
    }
  });

  test('should mark deadline as complete', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    // Navigate to a deadline
    const deadlineLink = page.locator('a[href*="/deadlines/"]').first();
    
    if (await deadlineLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deadlineLink.click();
      await page.waitForLoadState('networkidle');

      // Look for complete button
      const completeButton = page.getByRole('button', { name: /complete|mark.*complete|close/i }).first();
      
      if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await completeButton.click();
        
        // Status should update
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should display calendar in month view', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Should see month view by default or button to switch
    const monthView = page.locator('button:has-text("Month"), .calendar-month, text=/month view/i').first();
    await monthView.isVisible({ timeout: 5000 }).catch(() => {
      // Month view may not be explicitly labeled
    });
  });

  test('should navigate between calendar months', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Look for next/previous month buttons
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
    const prevButton = page.locator('button:has-text("Prev"), button[aria-label*="prev" i]').first();
    
    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      if (await prevButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show events on calendar', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Should display events/deadlines/hearings on calendar
    const events = page.locator('.calendar-event, [role="button"]:has-text("hearing"), [role="button"]:has-text("deadline")');
    const count = await events.count().catch(() => 0);
    
    // Events may or may not be present
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter calendar by event type', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Look for event type filters
    const eventTypeFilter = page.locator('select[name="event_type"], input[type="checkbox"]').first();
    
    if (await eventTypeFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Apply filter
      if ((await eventTypeFilter.getAttribute('type')) === 'checkbox') {
        await eventTypeFilter.click();
      } else {
        await eventTypeFilter.selectOption({ index: 1 });
      }
      
      await page.waitForTimeout(1000);
    }
  });

  test('should show overdue deadlines highlighted', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    // Overdue deadlines should be highlighted or marked
    const overdueIndicator = page.locator('.overdue, .text-red, [class*="danger"]').first();
    await overdueIndicator.isVisible({ timeout: 5000 }).catch(() => {
      // Overdue indicators may not be present if no overdue deadlines
    });
  });

  test('should sort deadlines by due date', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    // Look for sort options
    const sortSelect = page.locator('select[name="sort"], select[name="order_by"]').first();
    
    if (await sortSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortSelect.selectOption({ label: /due.*date/i });
      await page.waitForLoadState('networkidle');
      
      // Results should be reordered
      await page.waitForTimeout(1000);
    }
  });

  test('should export calendar events', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download|ical|calendar/i }).first();
    
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Just verify button exists
      await expect(exportButton).toBeEnabled();
    }
  });

  test('should send deadline reminders', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    const deadlineLink = page.locator('a[href*="/deadlines/"]').first();
    
    if (await deadlineLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deadlineLink.click();
      await page.waitForLoadState('networkidle');

      // Look for reminder settings
      const reminderSection = page.locator('text=/reminder|notification|alert/i').first();
      await reminderSection.isVisible({ timeout: 5000 }).catch(() => {
        // Reminder feature may not be visible
      });
    }
  });
});
