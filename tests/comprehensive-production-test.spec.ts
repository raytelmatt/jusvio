import { test, expect } from '@playwright/test';

const BASE_URL = 'https://jusivo.com';
const TEST_EMAIL = 'iahmatt@icloud.com';
const TEST_PASSWORD = 'Kb5teh04';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  issues: [] as Array<{test: string, issue: string, severity: 'high' | 'medium' | 'low'}>
};

function trackIssue(testName: string, issue: string, severity: 'high' | 'medium' | 'low' = 'medium') {
  testResults.issues.push({ test: testName, issue, severity });
  testResults.failed++;
  console.log(`❌ ${testName}: ${issue} (${severity})`);
}

function trackSuccess(testName: string) {
  testResults.passed++;
  console.log(`✅ ${testName}: Passed`);
}

test.describe('Comprehensive Production Testing - Jusivo.com', () => {
  test.beforeAll(async () => {
    console.log('🚀 Starting comprehensive testing of https://jusivo.com');
    console.log(`📧 Using test credentials: ${TEST_EMAIL}`);
  });

  test.afterAll(async () => {
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📋 Total Issues Found: ${testResults.issues.length}`);
    
    if (testResults.issues.length > 0) {
      console.log('\n🔍 Issues Summary:');
      testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.test}: ${issue.issue}`);
      });
    }
  });

  test('Site Loading and Initial State', async ({ page }) => {
    const testName = 'Site Loading and Initial State';
    
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Check if redirected to login
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        trackSuccess(testName);
      } else {
        trackIssue(testName, `Expected login redirect, but got: ${currentUrl}`, 'high');
      }
      
      // Check for login form elements
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const signInButton = page.getByRole('button', { name: /sign in|login/i });
      
      if (await emailInput.isVisible()) {
        trackSuccess('Login form - Email input visible');
      } else {
        trackIssue('Login form', 'Email input not visible', 'high');
      }
      
      if (await passwordInput.isVisible()) {
        trackSuccess('Login form - Password input visible');
      } else {
        trackIssue('Login form', 'Password input not visible', 'high');
      }
      
      if (await signInButton.isVisible()) {
        trackSuccess('Login form - Sign in button visible');
      } else {
        trackIssue('Login form', 'Sign in button not visible', 'high');
      }
      
    } catch (error) {
      trackIssue(testName, `Site failed to load: ${error.message}`, 'high');
    }
  });

  test('Authentication Flow', async ({ page }) => {
    const testName = 'Authentication Flow';
    
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      // Fill login form
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      
      // Take screenshot before login
      await page.screenshot({ path: 'test-results/before-login.png' });
      
      // Click sign in
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Wait for dashboard or error
      try {
        await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 30000 });
        trackSuccess(testName);
        await page.screenshot({ path: 'test-results/after-login-success.png' });
      } catch (error) {
        // Check for error messages
        const errorMessage = page.locator('[role="alert"], .error, .alert-danger');
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          trackIssue(testName, `Login failed with error: ${errorText}`, 'high');
        } else {
          trackIssue(testName, 'Login failed - no dashboard found and no error message', 'high');
        }
        await page.screenshot({ path: 'test-results/login-failed.png' });
      }
      
    } catch (error) {
      trackIssue(testName, `Authentication test failed: ${error.message}`, 'high');
    }
  });

  test('Dashboard Navigation', async ({ page }) => {
    const testName = 'Dashboard Navigation';
    
    try {
      // Login first
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Wait for dashboard
      await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 30000 });
      
      // Test navigation to different sections
      const sections = [
        { name: 'Matters', url: '/matters' },
        { name: 'Clients', url: '/clients' },
        { name: 'Documents', url: '/documents' },
        { name: 'Billing', url: '/billing' },
        { name: 'Reports', url: '/reports' }
      ];
      
      for (const section of sections) {
        try {
          const link = page.getByRole('link', { name: section.name });
          if (await link.isVisible()) {
            await link.click();
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            
            const currentUrl = page.url();
            if (currentUrl.includes(section.url)) {
              trackSuccess(`Navigation to ${section.name}`);
              await page.screenshot({ path: `test-results/${section.name.toLowerCase()}-page.png` });
            } else {
              trackIssue(`Navigation to ${section.name}`, `Expected URL containing ${section.url}, got: ${currentUrl}`, 'medium');
            }
          } else {
            trackIssue(`Navigation to ${section.name}`, 'Navigation link not visible', 'medium');
          }
        } catch (error) {
          trackIssue(`Navigation to ${section.name}`, `Navigation failed: ${error.message}`, 'medium');
        }
      }
      
    } catch (error) {
      trackIssue(testName, `Dashboard navigation test failed: ${error.message}`, 'high');
    }
  });

  test('Client Management', async ({ page }) => {
    const testName = 'Client Management';
    
    try {
      // Login and navigate to clients
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 30000 });
      await page.getByRole('link', { name: 'Clients' }).click();
      await expect(page).toHaveURL(/\/clients/, { timeout: 15000 });
      
      // Test client list view
      const clientList = page.locator('[data-testid="client-list"], .client-list, table');
      if (await clientList.isVisible()) {
        trackSuccess('Client list view');
      } else {
        trackIssue('Client Management', 'Client list not visible', 'medium');
      }
      
      // Test add client button
      const addClientButton = page.getByRole('button', { name: /add client|new client/i });
      if (await addClientButton.isVisible()) {
        trackSuccess('Add client button visible');
        
        // Test clicking add client
        try {
          await addClientButton.click();
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          
          const currentUrl = page.url();
          if (currentUrl.includes('/clients/new') || currentUrl.includes('/clients/create')) {
            trackSuccess('Add client navigation');
            
            // Test form elements
            const firstNameInput = page.getByPlaceholder(/first name/i);
            const lastNameInput = page.getByPlaceholder(/last name/i);
            const emailInput = page.getByPlaceholder(/email/i);
            
            if (await firstNameInput.isVisible()) {
              trackSuccess('Client form - First name input');
            } else {
              trackIssue('Client form', 'First name input not visible', 'medium');
            }
            
            if (await lastNameInput.isVisible()) {
              trackSuccess('Client form - Last name input');
            } else {
              trackIssue('Client form', 'Last name input not visible', 'medium');
            }
            
            if (await emailInput.isVisible()) {
              trackSuccess('Client form - Email input');
            } else {
              trackIssue('Client form', 'Email input not visible', 'medium');
            }
            
          } else {
            trackIssue('Add client navigation', `Expected client creation page, got: ${currentUrl}`, 'medium');
          }
        } catch (error) {
          trackIssue('Add client navigation', `Failed to navigate to add client: ${error.message}`, 'medium');
        }
      } else {
        trackIssue('Client Management', 'Add client button not visible', 'medium');
      }
      
    } catch (error) {
      trackIssue(testName, `Client management test failed: ${error.message}`, 'high');
    }
  });

  test('Matter Management', async ({ page }) => {
    const testName = 'Matter Management';
    
    try {
      // Login and navigate to matters
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 30000 });
      await page.getByRole('link', { name: 'Matters' }).click();
      await expect(page).toHaveURL(/\/matters/, { timeout: 15000 });
      
      // Test matter list view
      const matterList = page.locator('[data-testid="matter-list"], .matter-list, table');
      if (await matterList.isVisible()) {
        trackSuccess('Matter list view');
      } else {
        trackIssue('Matter Management', 'Matter list not visible', 'medium');
      }
      
      // Test add matter button
      const addMatterButton = page.getByRole('button', { name: /add matter|new matter/i });
      if (await addMatterButton.isVisible()) {
        trackSuccess('Add matter button visible');
        
        // Test clicking add matter
        try {
          await addMatterButton.click();
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          
          const currentUrl = page.url();
          if (currentUrl.includes('/matters/new') || currentUrl.includes('/matters/create')) {
            trackSuccess('Add matter navigation');
            
            // Test form elements
            const titleInput = page.getByPlaceholder(/matter title|case title/i);
            const descriptionInput = page.getByPlaceholder(/description/i);
            
            if (await titleInput.isVisible()) {
              trackSuccess('Matter form - Title input');
            } else {
              trackIssue('Matter form', 'Title input not visible', 'medium');
            }
            
            if (await descriptionInput.isVisible()) {
              trackSuccess('Matter form - Description input');
            } else {
              trackIssue('Matter form', 'Description input not visible', 'medium');
            }
            
          } else {
            trackIssue('Add matter navigation', `Expected matter creation page, got: ${currentUrl}`, 'medium');
          }
        } catch (error) {
          trackIssue('Add matter navigation', `Failed to navigate to add matter: ${error.message}`, 'medium');
        }
      } else {
        trackIssue('Matter Management', 'Add matter button not visible', 'medium');
      }
      
    } catch (error) {
      trackIssue(testName, `Matter management test failed: ${error.message}`, 'high');
    }
  });

  test('Document Management', async ({ page }) => {
    const testName = 'Document Management';
    
    try {
      // Login and navigate to documents
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 30000 });
      
      // Try to navigate to documents
      const documentsLink = page.getByRole('link', { name: 'Documents' });
      if (await documentsLink.isVisible()) {
        await documentsLink.click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const currentUrl = page.url();
        if (currentUrl.includes('/documents')) {
          trackSuccess('Documents page navigation');
          
          // Test document list or upload functionality
          const documentList = page.locator('[data-testid="document-list"], .document-list, table');
          const uploadButton = page.getByRole('button', { name: /upload|add document/i });
          
          if (await documentList.isVisible()) {
            trackSuccess('Document list view');
          } else if (await uploadButton.isVisible()) {
            trackSuccess('Document upload functionality');
          } else {
            trackIssue('Document Management', 'No document list or upload functionality visible', 'medium');
          }
        } else {
          trackIssue('Documents navigation', `Expected documents page, got: ${currentUrl}`, 'medium');
        }
      } else {
        trackIssue('Document Management', 'Documents navigation link not visible', 'medium');
      }
      
    } catch (error) {
      trackIssue(testName, `Document management test failed: ${error.message}`, 'high');
    }
  });

  test('Billing and Invoice Management', async ({ page }) => {
    const testName = 'Billing and Invoice Management';
    
    try {
      // Login and navigate to billing
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 30000 });
      
      // Try to navigate to billing
      const billingLink = page.getByRole('link', { name: 'Billing' });
      if (await billingLink.isVisible()) {
        await billingLink.click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const currentUrl = page.url();
        if (currentUrl.includes('/billing')) {
          trackSuccess('Billing page navigation');
          
          // Test billing functionality
          const invoiceList = page.locator('[data-testid="invoice-list"], .invoice-list, table');
          const generateInvoiceButton = page.getByRole('button', { name: /generate invoice|new invoice/i });
          
          if (await invoiceList.isVisible()) {
            trackSuccess('Invoice list view');
          } else if (await generateInvoiceButton.isVisible()) {
            trackSuccess('Generate invoice functionality');
          } else {
            trackIssue('Billing Management', 'No invoice list or generation functionality visible', 'medium');
          }
        } else {
          trackIssue('Billing navigation', `Expected billing page, got: ${currentUrl}`, 'medium');
        }
      } else {
        trackIssue('Billing Management', 'Billing navigation link not visible', 'medium');
      }
      
    } catch (error) {
      trackIssue(testName, `Billing management test failed: ${error.message}`, 'high');
    }
  });

  test('Responsive Design', async ({ page }) => {
    const testName = 'Responsive Design';
    
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.reload();
        
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
          trackSuccess(`${viewport.name} viewport - Login form visible`);
          await page.screenshot({ path: `test-results/${viewport.name.toLowerCase()}-viewport.png` });
        } else {
          trackIssue(`${viewport.name} viewport`, 'Login form not visible', 'medium');
        }
      }
      
    } catch (error) {
      trackIssue(testName, `Responsive design test failed: ${error.message}`, 'medium');
    }
  });

  test('Performance and Loading', async ({ page }) => {
    const testName = 'Performance and Loading';
    
    try {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 5000) {
        trackSuccess(`Page load time: ${loadTime}ms`);
      } else {
        trackIssue('Performance', `Slow page load time: ${loadTime}ms`, 'medium');
      }
      
      // Check for console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      if (consoleErrors.length === 0) {
        trackSuccess('No console errors detected');
      } else {
        trackIssue('Console Errors', `${consoleErrors.length} console errors found`, 'low');
        consoleErrors.forEach(error => {
          console.log(`  - ${error}`);
        });
      }
      
    } catch (error) {
      trackIssue(testName, `Performance test failed: ${error.message}`, 'medium');
    }
  });

  test('Accessibility Basic Checks', async ({ page }) => {
    const testName = 'Accessibility Basic Checks';
    
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      // Check for basic accessibility elements
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      // Check for labels
      const emailLabel = page.locator('label[for*="email"], label:has-text("email")');
      const passwordLabel = page.locator('label[for*="password"], label:has-text("password")');
      
      if (await emailLabel.isVisible() || await emailInput.getAttribute('aria-label')) {
        trackSuccess('Email input has label or aria-label');
      } else {
        trackIssue('Accessibility', 'Email input missing label or aria-label', 'medium');
      }
      
      if (await passwordLabel.isVisible() || await passwordInput.getAttribute('aria-label')) {
        trackSuccess('Password input has label or aria-label');
      } else {
        trackIssue('Accessibility', 'Password input missing label or aria-label', 'medium');
      }
      
      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      if (headingCount > 0) {
        trackSuccess(`Found ${headingCount} headings`);
      } else {
        trackIssue('Accessibility', 'No headings found on page', 'medium');
      }
      
    } catch (error) {
      trackIssue(testName, `Accessibility test failed: ${error.message}`, 'medium');
    }
  });
});
