# Jusivo Case Manager - Testing Guide

## Overview

This guide provides comprehensive information about the testing infrastructure for the Jusivo Case Manager application. The test suite includes both unit tests and end-to-end (E2E) tests to ensure application quality and reliability.

## Test Statistics

### Current Test Coverage
- **82 Unit Tests** - All passing
- **111 E2E Tests** - Comprehensive workflow coverage
- **Total: 193 Tests**

### Test Execution
```bash
# Run unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

## Unit Tests

### Test Framework
- **Framework**: Vitest
- **UI Library Testing**: React Testing Library
- **Environment**: jsdom

### Unit Test Structure

#### 1. Billing Validators (`src/react-app/lib/__tests__/billing-validators.test.ts`)
**46 tests covering:**
- Line item validation (8 tests)
  - Valid line items
  - Missing/invalid descriptions
  - Negative quantities and rates
  - Amount calculation verification
  - Floating point precision handling
  
- Invoice validation (9 tests)
  - Complete invoice validation
  - Negative and invalid totals
  - Line item consistency
  - Subtotal calculations
  - Tax and discount calculations
  - JSON string parsing
  
- Payment validation (8 tests)
  - Valid payments
  - Invalid amounts
  - Overpayment prevention
  - Multiple payment handling
  - Payment method validation
  
- Invoice calculations (7 tests)
  - Total calculations with taxes/discounts
  - Empty line items
  - Rate validation
  - Decimal precision
  
- Utility functions (14 tests)
  - ID normalization
  - Numeric value parsing
  - Currency formatting
  - Matter-client associations

#### 2. Client Utilities (`src/react-app/lib/__tests__/client-utils.test.ts`)
**11 tests covering:**
- Firebase document normalization
- Missing field handling
- Type conversions
- Boolean value handling
- Timestamp management
- Contact method validation

#### 3. Document Generator (`src/shared/__tests__/document-generator.test.ts`)
**9 tests covering:**
- Template variable replacement
- PDF generation
- DOCX generation
- Filename sanitization
- Date formatting
- Multi-line content handling
- Variable validation

#### 4. Protected Route Component (`src/react-app/components/__tests__/ProtectedRoute.test.tsx`)
**6 tests covering:**
- Authenticated user rendering
- Loading state handling
- Login redirect for unauthenticated users
- State transitions
- User property validation

#### 5. Network Status Component (`src/react-app/components/__tests__/NetworkStatus.test.tsx`)
**6 tests covering:**
- Online state (no display)
- Offline notification
- Reconnection notification
- Event listener registration/cleanup
- Multiple state transitions

## End-to-End Tests

### Test Framework
- **Framework**: Playwright
- **Browser Support**: Chromium, Firefox, WebKit

### E2E Test Suites

#### 1. Client Workflow (`tests/client-workflow.spec.ts`)
**7 tests:**
- Create new client with validation
- Search for clients
- View client details
- Form validation errors
- Navigate to client matters
- Display contact information
- Edit client information

#### 2. Matter Workflow (`tests/matter-workflow.spec.ts`)
**10 tests:**
- Create new matter for existing client
- View matter details
- Add tasks to matters
- Filter by practice area
- Filter by status
- Navigate between matter tabs
- Display matter documents
- Display billing information
- Form validation
- Search matters

#### 3. Billing Workflow (`tests/billing-workflow.spec.ts`)
**11 tests:**
- Navigate to billing page
- Create time entries
- Create invoices
- View invoice details
- Calculate invoice totals
- View client balances
- Filter invoices by status
- Form validation
- Display time entries
- Add payments to invoices
- Export/print invoices

#### 4. Document Workflow (`tests/document-workflow.spec.ts`)
**13 tests:**
- Navigate to documents page
- Upload documents
- Generate documents from templates
- List available templates
- Filter by matter
- Filter by document type
- View document details
- Create new templates
- Search documents
- Display document metadata
- Download documents
- Template form validation
- Document versioning

#### 5. Authentication (`tests/authentication.spec.ts`)
**11 tests:**
- Display login page
- Show login form fields
- Submit button presence
- Validate required fields
- Show error for invalid credentials
- Redirect after successful login
- Protect authenticated routes
- Remember user session
- User logout
- Password visibility toggle

#### 6. Dashboard and Navigation (`tests/dashboard-navigation.spec.ts`)
**19 tests:**
- Display dashboard
- Navigation menu
- Navigate to all main sections (clients, matters, documents, billing, calendar, deadlines, settings)
- Display statistics
- Recent activity
- Upcoming deadlines
- Upcoming hearings
- User profile
- Mobile navigation
- Active navigation highlighting
- Quick actions
- Practice area breakdown
- Breadcrumb navigation
- Scroll position maintenance

#### 7. Calendar and Deadlines (`tests/calendar-deadlines.spec.ts`)
**17 tests:**
- Display calendar page
- Display deadlines page
- Create new deadlines
- Create new hearings
- Filter by status
- Filter by date range
- View deadline details
- Mark deadlines complete
- Calendar month view
- Navigate between months
- Show events on calendar
- Filter by event type
- Highlight overdue deadlines
- Sort deadlines
- Export calendar
- Deadline reminders

#### 8. Communications and Intake Forms (`tests/communications-intake.spec.ts`)
**23 tests:**
- Navigate to communications page
- Display communications list
- Filter communications (by client, matter, channel)
- View communication details
- Search communications
- Sort communications by date
- Display intake forms (general and criminal)
- Fill out intake forms with validation
- Navigate between intake form types
- View submitted intakes (admin)
- Filter intakes (by status, practice area)
- Convert intake to client
- Client portal login and validation

## Test Configuration

### Vitest Configuration (`vite.config.test.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/**', // Exclude Playwright E2E tests
    ],
  },
})
```

### Playwright Configuration (`playwright.config.ts`)
- Base URL configuration
- Firebase authentication setup
- Multiple browser support
- Test artifacts and reports
- Screenshot on failure
- Video recording options

## Writing New Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('MyModule', () => {
  describe('myFunction', () => {
    it('should handle valid input', () => {
      const result = myFunction('valid-input');
      expect(result).toBe('expected-output');
    });

    it('should throw error for invalid input', () => {
      expect(() => myFunction('invalid')).toThrow();
    });
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';
import { authenticateWithFirebase, getFirebaseTestConfig } from './firebase-test-utils';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    const config = getFirebaseTestConfig();
    await authenticateWithFirebase(page, config.testEmail, config.testPassword);
  });

  test('should perform action', async ({ page }) => {
    await page.goto('/path');
    await page.getByRole('button', { name: /click me/i }).click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Best Practices

### Unit Tests
1. **Test one thing at a time** - Each test should verify a single behavior
2. **Use descriptive names** - Test names should clearly state what is being tested
3. **Arrange-Act-Assert** - Structure tests clearly with setup, execution, and verification
4. **Mock external dependencies** - Isolate the code under test
5. **Test edge cases** - Include boundary conditions, null values, and error scenarios

### E2E Tests
1. **Test user workflows** - Focus on complete user journeys
2. **Use data-testid sparingly** - Prefer role-based and text-based selectors
3. **Wait appropriately** - Use Playwright's auto-waiting, add explicit waits when needed
4. **Clean up test data** - Ensure tests don't leave artifacts
5. **Make tests resilient** - Handle timing issues and flaky scenarios gracefully

## Test Data Management

### Unit Tests
- Use mocked data for isolated testing
- Mock Firebase/database calls
- Create reusable test fixtures

### E2E Tests
- Use Firebase Test Utils for authentication
- Create test data in beforeEach hooks
- Clean up in afterEach hooks when possible
- Use unique identifiers (timestamps) to avoid conflicts

## Continuous Integration

### GitHub Actions
Tests are automatically run on:
- Pull request creation
- Push to main branch
- Manual workflow dispatch

### Test Environments
- **Development**: Local testing with hot reload
- **CI**: Automated testing on GitHub Actions
- **Production**: Smoke tests against production environment

## Coverage Goals

### Current Coverage
- Business logic: ~90% (billing validators, client utils)
- Components: ~30% (key components covered)
- E2E workflows: ~80% (major user journeys)

### Target Coverage
- Business logic: 95%+
- Components: 80%+
- E2E workflows: 90%+

## Troubleshooting

### Common Issues

#### Unit Tests
- **DOM not defined**: Ensure jsdom environment is set in vite.config.test.ts
- **Module import errors**: Check path aliases in test setup
- **Async test failures**: Use proper async/await patterns

#### E2E Tests
- **Authentication failures**: Verify Firebase credentials in environment
- **Timeout errors**: Increase timeout for slow operations
- **Flaky tests**: Add appropriate waits and use Playwright's auto-waiting
- **Selector not found**: Use more flexible selectors, check element visibility timing

### Debug Mode

#### Unit Tests
```bash
# Run with UI for debugging
npm run test:ui

# Run specific test file
npm test -- billing-validators.test.ts

# Run in watch mode
npm test -- --watch
```

#### E2E Tests
```bash
# Run with headed browser
npm run test:e2e:headed

# Run with Playwright inspector
npx playwright test --debug

# Run specific test
npx playwright test authentication.spec.ts
```

## Future Enhancements

### Planned Tests
- [ ] Email service unit tests
- [ ] Dashboard utilities tests
- [ ] Additional component tests (FileUploadZone, NotificationPanel, etc.)
- [ ] Client portal E2E tests
- [ ] Integration tests for backend adapters
- [ ] Performance tests
- [ ] Accessibility tests
- [ ] Visual regression tests

### Test Infrastructure
- [ ] Code coverage reporting in CI
- [ ] Test result dashboard
- [ ] Automated test data generation
- [ ] Parallel test execution optimization
- [ ] Test performance metrics

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testingjavascript.com/)

## Contact

For questions about testing or to report issues:
- Create an issue in the repository
- Contact the development team
- Review existing tests for examples
