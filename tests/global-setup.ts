import { chromium, FullConfig } from '@playwright/test';
import { waitForFirebaseAuth } from './firebase-test-utils';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log('Setting up Firebase authentication for tests...');
  
  // Create a browser instance for authentication setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the login page
    await page.goto(`${baseURL}/login`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're already authenticated by waiting briefly for auth signals
    let isAuthenticated = false;
    try {
      await waitForFirebaseAuth(page, 5000);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
    
    if (!isAuthenticated) {
      console.log('Authentication required. Please ensure test credentials are configured.');
      // For now, we'll create an empty auth state file
      // In a real scenario, you would implement Firebase authentication here
      await context.storageState({ path: 'tests/auth-state.json' });
    } else {
      console.log('Already authenticated, saving auth state...');
      await context.storageState({ path: 'tests/auth-state.json' });
    }
    
  } catch (error) {
    console.error('Global setup failed:', error);
    // Create empty auth state as fallback
    await context.storageState({ path: 'tests/auth-state.json' });
  } finally {
    await browser.close();
  }
  
  console.log('Global setup completed.');
}

export default globalSetup;
