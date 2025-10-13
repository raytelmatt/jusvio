# Linear Issues Report - Playwright Test Failures
**Generated:** 2025-10-13  
**Source:** Playwright E2E tests on https://jusivo.com  
**Total Critical Issues:** 5

---

## Issue 1: Authentication System Failure on Production

**Type:** bug  
**Priority:** 1 (Urgent)  
**Labels:** bug, authentication, production, critical  
**Assignee:** Matthew Ray  
**Team:** RAYTEL  

### Title
[BUG] Production authentication succeeds but dashboard fails to load

### Description

**Impact:** CRITICAL - Blocks 20+ E2E tests and likely affects real users

**Observed Behavior:**
- User submits valid credentials (iahmatt@icloud.com)
- Login form accepts credentials (no error shown)
- Page does not redirect to dashboard
- `data-testid="dashboard"` element never appears in DOM
- No error message displayed to user
- Tests timeout waiting 30+ seconds

**Expected Behavior:**
- Successful login should redirect to dashboard
- Dashboard should render with proper elements
- User should see navigation menu

**Reproduction:**
1. Visit https://jusivo.com
2. Enter email: iahmatt@icloud.com
3. Enter password: Kb5teh04
4. Click "Sign In" button
5. Observe: No redirect, no dashboard, no error

**Technical Details:**
```
Error: expect(locator).toBeVisible() failed
Locator: getByTestId('dashboard')
Expected: visible
Received: <element(s) not found>
Timeout: 30000ms
```

**Affected Tests:**
- `comprehensive-production-test.spec.ts › Authentication Flow`
- `login-and-matters.spec.ts › should successfully login`
- All tests requiring authenticated state (20+)

**Investigation Needed:**
- [ ] Check Firebase auth configuration on production
- [ ] Verify dashboard route exists and is protected
- [ ] Check browser console for JavaScript errors
- [ ] Verify auth state persistence in Firebase
- [ ] Check for redirect logic after successful login
- [ ] Verify dashboard component renders

**Files to Check:**
- Login page component
- Firebase auth configuration
- Dashboard route configuration
- Auth state management

**Priority Justification:** This is a production-blocking bug that prevents users from accessing the application after login.

---

## Issue 2: Hard-Coded Localhost URLs in Billing Tests

**Type:** bug  
**Priority:** 2 (High)  
**Labels:** bug, testing, configuration  
**Assignee:** Matthew Ray  
**Team:** RAYTEL  

### Title
[BUG] Billing system tests fail on production due to hard-coded localhost URLs

### Description

**Impact:** 5 billing system tests fail immediately on production

**Problem:**
The file `tests/billing-system.spec.ts` contains hard-coded `http://localhost:5173` URLs instead of using the configurable `baseURL` parameter. This causes immediate test failures when running against production.

**Error:**
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
```

**Affected Lines:**
- `tests/billing-system.spec.ts:11` (beforeEach hook)
- `tests/billing-system.spec.ts:27` (second test)
- `tests/billing-system.spec.ts:240` (invoice navigation test)

**Failed Tests:**
1. Should create invoice with correct totals in matter billing tab
2. Should record payment and update totals correctly
3. Should display correct invoice amounts in billing list
4. Should show correct time entry amounts in billing tab
5. Should navigate between billing tab and invoice details

**Fix Required:**
```typescript
// WRONG ❌
await page.goto('http://localhost:5173');

// CORRECT ✅
await page.goto(baseURL);
// or
const { baseURL } = page.context();
await page.goto(baseURL);
```

**Code Changes Needed:**
Replace all instances of hard-coded localhost in `tests/billing-system.spec.ts`:
- Line 11: `await page.goto('http://localhost:5173');`
- Line 27: `await page.goto('http://localhost:5173/matters');`
- Line 240: `await page.goto('http://localhost:5173');`

**Verification:**
After fix, run:
```bash
BASE_URL=https://jusivo.com npm run test:e2e -- tests/billing-system.spec.ts
```

**Priority Justification:** Quick fix that will unlock 5 important billing tests. Low risk change.

---

## Issue 3: Missing Test Data Attributes in Production Build

**Type:** tech-debt  
**Priority:** 2 (High)  
**Labels:** technical-debt, testing, production  
**Assignee:** Matthew Ray  
**Team:** RAYTEL  

### Title
[TECH-DEBT] Production build missing data-testid attributes causing test failures

### Description

**Impact:** Tests are brittle and unreliable due to missing test identifiers

**Problem:**
E2E tests rely on `data-testid` attributes to locate elements, but these attributes are not present in the production build. This causes tests to fail even when the application is functioning correctly.

**Missing Attributes:**
- `data-testid="dashboard"` - Main dashboard container
- Other test identifiers throughout the application

**Current Test Failures:**
Multiple tests fail with:
```
expect(locator).toBeVisible() failed
Locator: getByTestId('dashboard')
Expected: visible
Received: <element(s) not found>
```

**Solutions (Choose One):**

### Option 1: Include Test IDs in Production (Recommended)
**Pros:**
- Minimal code changes
- Test reliability improves
- No impact on performance (data attributes are lightweight)
- Enables production monitoring/debugging

**Cons:**
- Slightly larger HTML output (negligible)

**Implementation:**
No changes needed - keep `data-testid` in source code

### Option 2: Use Build Flag for Test IDs
**Pros:**
- Clean production HTML
- Test IDs only in test builds

**Cons:**
- Cannot test actual production build
- Requires separate build configuration
- More complex CI/CD

**Implementation:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    removeTestIds() // only in production
  ]
});
```

### Option 3: Refactor to Semantic Selectors (Best Long-term)
**Pros:**
- Tests use accessible names/roles
- Better accessibility
- Tests real user experience
- No dependency on test attributes

**Cons:**
- Requires refactoring all tests
- More time-consuming
- Some elements harder to target

**Implementation:**
```typescript
// BEFORE
await page.getByTestId('dashboard').waitFor();

// AFTER
await page.getByRole('main', { name: 'Dashboard' }).waitFor();
// or
await page.getByLabel('Dashboard').waitFor();
```

**Recommendation:**
Short-term: Option 1 (keep test IDs in production)  
Long-term: Option 3 (refactor to semantic selectors)

**Files Affected:**
- All component files with `data-testid` attributes
- All test files using `getByTestId()`

**Priority Justification:** Affects test reliability and developer productivity. Choose strategy and implement consistently.

---

## Issue 4: Navigation Elements Not Found After Login

**Type:** bug  
**Priority:** 2 (High)  
**Labels:** bug, ui, navigation, production  
**Assignee:** Matthew Ray  
**Team:** RAYTEL  

### Title
[BUG] Navigation menu elements not found after login attempt

### Description

**Impact:** Users cannot navigate to key sections after login (Matters, Clients, etc.)

**Problem:**
After login attempt, navigation elements are not present in the DOM. Tests cannot find:
- "Matters" link
- "Clients" link
- Other navigation menu items

**Error:**
```
expect(locator).toBeVisible() failed
Locator: getByRole('link', { name: 'Matters' })
Expected: visible
Received: <element(s) not found>
Timeout: 30000ms
```

**Possible Root Causes:**

### 1. Login Failure (Most Likely)
Navigation doesn't render because user is not actually authenticated.
Related to Issue #1 - Authentication System Failure.

### 2. Navigation Component Not Rendering
Component fails to mount after successful authentication.
- Check for JavaScript errors in browser console
- Verify navigation component in authenticated route

### 3. Race Condition
Navigation loads after test assertion runs.
- Add proper wait conditions
- Wait for auth state before checking navigation

### 4. DOM Structure Changed
Navigation HTML structure changed but tests not updated.
- Verify navigation element structure on production
- Update test selectors if needed

**Investigation Steps:**
1. [ ] Manually test login on https://jusivo.com
2. [ ] Check if navigation appears in browser dev tools after login
3. [ ] Look for JavaScript console errors
4. [ ] Verify navigation component code
5. [ ] Check auth state in Redux/Context after login
6. [ ] Verify route protection logic

**Affected Tests:**
- `production-login-test.spec.ts › should test basic app functionality`
- All tests expecting post-login navigation
- Dashboard navigation tests

**Manual Test:**
1. Open https://jusivo.com
2. Open browser dev tools console
3. Login with test credentials
4. Check for:
   - JavaScript errors in console
   - Navigation elements in DOM inspector
   - Network requests succeeding
   - Auth state in localStorage/cookies

**Priority Justification:** Core navigation functionality appears broken. May be symptom of Issue #1 or separate problem.

**Dependencies:** May be blocked by Issue #1 (Authentication System Failure)

---

## Issue 5: Login Form Accessibility - Missing Label Associations

**Type:** bug  
**Priority:** 3 (Normal)  
**Labels:** bug, accessibility, a11y, forms  
**Assignee:** Matthew Ray  
**Team:** RAYTEL  

### Title
[BUG] Login form inputs missing proper label associations

### Description

**Impact:** Accessibility violation, test reliability issues, screen reader users cannot use form

**Problem:**
Login form email and password inputs do not have proper `<label>` associations, causing:
1. Accessibility violations (WCAG 2.1)
2. Test failures using `getByLabel()` selectors
3. Poor experience for screen reader users

**Error:**
```
locator.fill: Test timeout of 240000ms exceeded.
waiting for getByLabel('Email')
```

**Current Issues:**
- Test cannot find email input using `getByLabel('Email')`
- Password input likely has same issue
- Form inputs may have placeholder text but no label

**WCAG 2.1 Requirements:**
- **3.3.2 Labels or Instructions (A):** Labels or instructions are provided when content requires user input
- **1.3.1 Info and Relationships (A):** Information, structure, and relationships can be programmatically determined

**Required Fixes:**

### Option 1: Add `<label>` elements (Best Practice)
```tsx
// BEFORE ❌
<input type="email" placeholder="Email" name="email" />
<input type="password" placeholder="Password" name="password" />

// AFTER ✅
<label htmlFor="email">Email</label>
<input type="email" id="email" name="email" placeholder="Enter your email" />

<label htmlFor="password">Password</label>
<input type="password" id="password" name="password" placeholder="Enter your password" />
```

### Option 2: Use `aria-label` (If visual labels not desired)
```tsx
// ALTERNATIVE ✅
<input 
  type="email" 
  name="email"
  aria-label="Email address"
  placeholder="Enter your email" 
/>
<input 
  type="password" 
  name="password"
  aria-label="Password"
  placeholder="Enter your password" 
/>
```

### Option 3: Use `aria-labelledby` (If label text exists elsewhere)
```tsx
// ALTERNATIVE ✅
<h2 id="email-label">Email</h2>
<input 
  type="email" 
  name="email"
  aria-labelledby="email-label"
  placeholder="Enter your email" 
/>
```

**Files to Update:**
- Login page component (likely `src/react-app/pages/Login.tsx` or similar)
- Check other forms throughout app for same issue

**Testing:**
After fix, verify:
```bash
# Test with Playwright
BASE_URL=https://jusivo.com npm run test:e2e -- tests/production-client-invoice.spec.ts

# Test with screen reader
# 1. Enable VoiceOver (Mac) or NVDA (Windows)
# 2. Navigate to login form
# 3. Verify labels are announced
```

**Additional Benefits:**
- Better UX for all users
- Larger click target (clicking label focuses input)
- Improved form usability on mobile
- Better SEO

**Priority Justification:** Accessibility is important but not blocking core functionality. Should be fixed for WCAG compliance.

---

## Summary of Linear Issues to Create

Run these commands to create all issues:

```bash
# Issue 1: Authentication failure (URGENT)
node scripts/linear/create-issue.mjs \
  --type bug \
  --title "Production authentication succeeds but dashboard fails to load" \
  --priority 1 \
  --labels "authentication,production,critical"

# Issue 2: Hard-coded URLs (HIGH)
node scripts/linear/create-issue.mjs \
  --type bug \
  --title "Billing system tests fail on production due to hard-coded localhost URLs" \
  --priority 2 \
  --labels "testing,configuration"

# Issue 3: Missing test attributes (HIGH)
node scripts/linear/create-issue.mjs \
  --type tech-debt \
  --title "Production build missing data-testid attributes causing test failures" \
  --priority 2 \
  --labels "testing,production"

# Issue 4: Navigation not found (HIGH)
node scripts/linear/create-issue.mjs \
  --type bug \
  --title "Navigation menu elements not found after login attempt" \
  --priority 2 \
  --labels "ui,navigation,production"

# Issue 5: Form accessibility (NORMAL)
node scripts/linear/create-issue.mjs \
  --type bug \
  --title "Login form inputs missing proper label associations" \
  --priority 3 \
  --labels "accessibility,a11y,forms"
```

---

## Test Results Reference

**Total Tests:** 41  
**Passed:** 14 (34%)  
**Failed:** 27 (66%)  

**Pass Rate by Category:**
- Authentication: 33%
- Billing System: 33%
- Responsive Design: 100%
- Performance: 100%
- Accessibility: 100%
- Dashboard/Navigation: 0%
- Client/Matter Management: 0%

**Full Report:** See `PLAYWRIGHT_TEST_REPORT.md`
