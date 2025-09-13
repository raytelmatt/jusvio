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
    testEmail: process.env.TEST_EMAIL,
    testPassword: process.env.TEST_PASSWORD,
  };
}

/**
 * Wait for Firebase authentication to complete
 */
export async function waitForFirebaseAuth(page: Page, timeout = 30000): Promise<void> {
  // Wait for Firebase auth state to be resolved
  await page.waitForFunction(() => {
    // Check if Firebase auth is initialized and user is authenticated
    return window.location.pathname !== '/login' && 
           document.querySelector('[data-testid="dashboard"]') !== null ||
           document.querySelector('a[href*="matters"]') !== null;
  }, { timeout });
}

/**
 * Check if user is authenticated with Firebase
 */
export async function isFirebaseAuthenticated(page: Page): Promise<boolean> {
  try {
    // Look for dashboard elements that indicate successful authentication
    const dashboardElements = [
      'a[href*="matters"]',
      'a[href*="clients"]',
      '[data-testid="dashboard"]',
      'text=Matters',
      'text=Clients'
    ];
    
    for (const selector of dashboardElements) {
      if (await page.locator(selector).isVisible({ timeout: 5000 })) {
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
  
  if (!testEmail || !testPassword) {
    throw new Error('Firebase test credentials not provided. Set TEST_EMAIL and TEST_PASSWORD environment variables.');
  }
  
  await page.goto('/login');
  
  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill credentials
  await page.locator('input[type="email"]').fill(testEmail);
  await page.locator('input[type="password"]').fill(testPassword);
  
  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for authentication to complete
  await waitForFirebaseAuth(page);
}

/**
 * Clean up Firebase test data (if needed)
 */
export async function cleanupFirebaseTestData(page: Page): Promise<void> {
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
