#!/bin/bash
# Create Linear issues from Playwright test results
# Generated: 2025-10-13
# Source: Playwright E2E tests on https://jusivo.com

echo "🔧 Creating 5 Linear issues from Playwright test failures..."
echo ""

# Issue 1: Authentication System Failure (URGENT)
echo "📋 Issue 1/5: Authentication System Failure"
linear issue create \
  --team RAYTEL \
  --title "[BUG] Production authentication succeeds but dashboard fails to load" \
  --description "CRITICAL: Login form accepts credentials but dashboard never renders. Blocks 20+ tests. User enters valid credentials, no error shown, but dashboard element never appears. Tests timeout after 30s waiting for data-testid='dashboard'. Affects all authenticated user flows on https://jusivo.com" \
  --assignee "Matthew Ray" \
  --labels "bug,authentication,production,critical,development" \
  --priority 1

echo ""

# Issue 2: Hard-Coded Localhost URLs (HIGH)
echo "📋 Issue 2/5: Hard-Coded Localhost URLs"
linear issue create \
  --team RAYTEL \
  --title "[BUG] Billing tests fail due to hard-coded localhost URLs" \
  --description "File tests/billing-system.spec.ts has hard-coded 'http://localhost:5173' on lines 11, 27, 240. Causes ERR_CONNECTION_REFUSED when running against production. Fix: Replace with baseURL parameter. Quick fix unlocks 5 billing tests." \
  --assignee "Matthew Ray" \
  --labels "bug,testing,configuration,development" \
  --priority 2

echo ""

# Issue 3: Missing Test Data Attributes (HIGH)
echo "📋 Issue 3/5: Missing Test Data Attributes"
linear issue create \
  --team RAYTEL \
  --title "[TECH-DEBT] Production build missing data-testid attributes" \
  --description "E2E tests fail because data-testid attributes not in production DOM. Mainly affects data-testid='dashboard'. Options: 1) Keep test IDs in production (recommended), 2) Use build flag, 3) Refactor to semantic selectors (long-term). Affects test reliability." \
  --assignee "Matthew Ray" \
  --labels "technical-debt,refactoring,testing,production,development" \
  --priority 2

echo ""

# Issue 4: Navigation Elements Not Found (HIGH)
echo "📋 Issue 4/5: Navigation Elements Not Found"
linear issue create \
  --team RAYTEL \
  --title "[BUG] Navigation menu not found after login" \
  --description "After login attempt, navigation links (Matters, Clients) not found in DOM. Likely related to auth failure issue. Tests timeout looking for getByRole('link', {name: 'Matters'}). Need to verify if navigation renders after successful login on production." \
  --assignee "Matthew Ray" \
  --labels "bug,ui,navigation,production,development" \
  --priority 2

echo ""

# Issue 5: Login Form Accessibility (NORMAL)
echo "📋 Issue 5/5: Login Form Accessibility"
linear issue create \
  --team RAYTEL \
  --title "[BUG] Login form inputs missing label associations" \
  --description "Login form email/password inputs lack proper <label> associations. Causes: 1) WCAG 2.1 accessibility violation, 2) Test timeout on getByLabel('Email'), 3) Poor screen reader experience. Fix: Add <label> elements with htmlFor, or add aria-label attributes." \
  --assignee "Matthew Ray" \
  --labels "bug,accessibility,a11y,forms,development" \
  --priority 3

echo ""
echo "✅ All 5 Linear issues created!"
echo ""
echo "Priority breakdown:"
echo "  🔴 Urgent (1):    1 issue  - Authentication system"
echo "  🟠 High (2):      3 issues - Localhost URLs, Test attributes, Navigation"
echo "  🟡 Normal (3):    1 issue  - Form accessibility"
echo ""
echo "Next steps:"
echo "  1. View issues in Linear: https://linear.app/raytel"
echo "  2. Review full test report: PLAYWRIGHT_TEST_REPORT.md"
echo "  3. See detailed issue specs: LINEAR_ISSUES_REPORT.md"
