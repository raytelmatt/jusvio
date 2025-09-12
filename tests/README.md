# Playwright Testing with Firebase

This directory contains Playwright end-to-end tests configured for Firebase authentication and backend services.

## Configuration

The Playwright configuration has been updated to work with Firebase instead of Appwrite. Key changes include:

### Environment Variables

Set these environment variables for Firebase testing:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=jusivo
FIREBASE_API_KEY=AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g
FIREBASE_AUTH_DOMAIN=jusivo.firebaseapp.com

# Test Credentials
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password

# Test Environment
BASE_URL=http://localhost:5173  # or https://www.jusivo.com for production
```

### Authentication Setup

The tests use a setup project (`auth.setup.ts`) to authenticate with Firebase before running the main tests. This ensures:

1. **Persistent Authentication**: Authentication state is saved and reused across tests
2. **Firebase Integration**: Tests work with Firebase Auth instead of Appwrite
3. **Environment Flexibility**: Can run against local development or production environments

### Test Structure

- `auth.setup.ts` - Handles Firebase authentication setup
- `global-setup.ts` - Global test setup and configuration
- `global-teardown.ts` - Cleanup after all tests complete
- `firebase-test-utils.ts` - Firebase-specific testing utilities
- `e2e-create-task.spec.ts` - Example end-to-end test

## Running Tests

### Local Development
```bash
# Run tests against local development server
npm run test:e2e

# Run with specific browser
npx playwright test --project=chromium

# Run with UI mode
npx playwright test --ui
```

### Production Testing
```bash
# Run tests against production
BASE_URL=https://www.jusivo.com npm run test:e2e
```

### CI/CD
```bash
# Set environment variables in your CI/CD pipeline
export FIREBASE_PROJECT_ID=jusivo
export FIREBASE_API_KEY=your-api-key
export FIREBASE_AUTH_DOMAIN=jusivo.firebaseapp.com
export TEST_EMAIL=your-test-email@example.com
export TEST_PASSWORD=your-test-password
export BASE_URL=https://www.jusivo.com

# Run tests
npx playwright test
```

## Firebase-Specific Features

### Authentication State Management
- Tests automatically authenticate with Firebase using email/password
- Authentication state is persisted between tests for efficiency
- Support for both local development and production Firebase projects

### Firebase Headers
- Tests include Firebase project identification headers
- Environment variables are passed to the development server when running locally

### Test Utilities
The `firebase-test-utils.ts` file provides:
- Firebase configuration management
- Authentication helpers
- Firebase-specific wait conditions
- Test data cleanup utilities

## Migration from Appwrite

The configuration has been updated from Appwrite to Firebase:

- **Authentication**: Now uses Firebase Auth instead of Appwrite Auth
- **Database**: Tests work with Firestore instead of Appwrite Database
- **Storage**: Tests work with Firebase Storage instead of Appwrite Storage
- **Configuration**: Environment variables updated for Firebase project settings

## Troubleshooting

### Authentication Issues
- Ensure `TEST_EMAIL` and `TEST_PASSWORD` are set correctly
- Verify Firebase project configuration matches your environment
- Check that the test user has appropriate permissions in Firebase

### Environment Issues
- Verify `BASE_URL` points to the correct environment
- Ensure Firebase project ID matches your configuration
- Check that all required environment variables are set

### Test Failures
- Check browser console for Firebase-related errors
- Verify network connectivity to Firebase services
- Ensure test data cleanup is working properly
