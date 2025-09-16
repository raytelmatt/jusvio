import { Page } from '@playwright/test';

/**
 * Firebase-specific test utilities for Playwright tests
 */

export interface FirebaseTestConfig {
  projectId: string;
  apiKey: string;
  authDomain: string;
  testEmail?: string;
  testPassword?: string;
}

export function getFirebaseTestConfig(): FirebaseTestConfig {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'jusivo',
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'jusivo.firebaseapp.com',
    testEmail: process.env.TEST_EMAIL || 'test@example.com',
    testPassword: process.env.TEST_PASSWORD || 'testpassword123',
  };
}

/**
 * Wait for Firebase authentication to complete
 */
export async function waitForFirebaseAuth(page: Page, timeout = 45000): Promise<void> {
  // Ensure page is at least loaded before waiting for auth
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: Math.min(5000, timeout) });
  } catch (error) {
    console.debug('waitForLoadState skipped before auth wait', error);
  }

  // Wait until we're no longer on the login/auth callback screen and either
  // Firebase auth keys exist in storage or common nav/dashboard elements are present
  await page.waitForFunction(() => {
    const path = window.location.pathname;
    const notAuthScreens = !path.startsWith('/login') && !path.startsWith('/auth/callback');

    // Firebase stores auth state in localStorage with keys like `firebase:authUser:*`
    const hasFirebaseAuthState = (() => {
      try {
        return Object.keys(window.localStorage || {}).some(k => k.includes('firebase:authUser'));
      } catch { return false; }
    })();

    // Look for common navigation/dashboard elements present post-login
    const hasNavLinks = Boolean(
      document.querySelector('a[href="/matters"], a[href="/clients"], a[href="/documents"], a[href="/deadlines"], a[href="/billing"], a[href="/"]')
    );
    const hasHeading = Boolean(document.querySelector('h1, [role="heading"]'));

    return (hasFirebaseAuthState && notAuthScreens) || hasNavLinks || (hasHeading && notAuthScreens);
  }, { timeout });
}

/**
 * Check if user is authenticated with Firebase
 */
export async function isFirebaseAuthenticated(page: Page): Promise<boolean> {
  try {
    // Fast path: check Firebase localStorage keys
    const hasAuthKey = await page.evaluate(() => {
      try { return Object.keys(window.localStorage || {}).some(k => k.includes('firebase:authUser')); } catch { return false; }
    });
    if (hasAuthKey) return true;

    // Look for common navigation elements post-login
    const dashboardSelectors = [
      'a[href="/matters"]',
      'a[href="/clients"]',
      'a[href="/documents"]',
      'a[href="/"]',
    ];

    for (const selector of dashboardSelectors) {
      if (await page.locator(selector).first().count()) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Perform Firebase authentication
 */
export async function authenticateWithFirebase(page: Page, email?: string, password?: string): Promise<void> {
  const config = getFirebaseTestConfig();
  const testEmail = email || config.testEmail;
  const testPassword = password || config.testPassword;
  
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Check if already authenticated
  if (await isFirebaseAuthenticated(page)) {
    console.log('User already authenticated, skipping login');
    return;
  }
  
  // Try to find login form elements
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
  const signInButton = page.getByRole('button', { name: /sign in|login|continue/i }).first();
  
  // Check if login form exists
  if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
    // Fill credentials
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    
    // Submit form
    if (await signInButton.count()) {
      await signInButton.click();
    } else {
      await page.keyboard.press('Enter');
    }
    
    // Wait for authentication to complete and redirect off /login
    await waitForFirebaseAuth(page);
  } else {
    console.log('No login form found, assuming already authenticated or using different auth method');
  }
}

/**
 * Clean up Firebase test data (if needed)
 */
export async function cleanupFirebaseTestData(page: Page): Promise<void> {
  void page;
  // This would be implemented based on your specific test data cleanup needs
  // For now, it's a placeholder
  console.log('Firebase test data cleanup - implement as needed');
}

/**
 * Get Firebase project information for debugging
 */
export function getFirebaseProjectInfo(): string {
  const config = getFirebaseTestConfig();
  return `Firebase Project: ${config.projectId}, Auth Domain: ${config.authDomain}`;
}
