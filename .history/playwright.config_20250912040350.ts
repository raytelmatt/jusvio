import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const isLocal = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');

// Firebase configuration for testing
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'jusivo';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g';
const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || 'jusivo.firebaseapp.com';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Firebase-specific test configuration
    extraHTTPHeaders: {
      'X-Firebase-Project': FIREBASE_PROJECT_ID,
    },
  },

  // Global test configuration for Firebase
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Firebase authentication state
        storageState: 'tests/auth-state.json',
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'tests/auth-state.json',
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'tests/auth-state.json',
      },
    },
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Use different storage state for setup
        storageState: 'tests/setup-auth-state.json',
      },
    },
  ],

  // Only start local dev server if testing a local URL
  webServer: isLocal
    ? {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
          // Pass Firebase environment variables to dev server
          FIREBASE_PROJECT_ID,
          FIREBASE_API_KEY,
          FIREBASE_AUTH_DOMAIN,
        },
      }
    : undefined,

  // Environment variables for tests
  env: {
    FIREBASE_PROJECT_ID,
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
  },
});
