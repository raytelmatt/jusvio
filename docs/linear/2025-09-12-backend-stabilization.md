Title: [TECH-DEBT] Stabilize Firebase backend adapter, Query API, notifications; remove secrets; fix build

Summary
- Resolved NotificationPanel recursion/shadow issues; aliased API functions
- Replaced Appwrite-only notification types with provider-neutral shapes; order by created_at
- Extended Query API with <=, >=, in; implemented in Firebase adapter; fixed Firestore data spread typing
- Dashboard uses Query.in for unpaid invoices; TS types updated
- Fixed Client Balances route link
- Removed undefined AppwriteDocument casts in DocumentDetail
- Hardened client-balances mapping; removed unsafe casts; normalized IDs and nullables
- Removed hardcoded Playwright credentials; tests now require env
- Added Firebase default envs and resilient constructor to avoid blank-page in dev

Files (key)
- src/react-app/components/NotificationPanel.tsx
- src/react-app/lib/notifications.ts
- src/react-app/lib/backend/types.ts
- src/react-app/lib/backend/firebase-adapter.ts
- src/react-app/lib/dashboard.ts
- src/react-app/pages/Billing.tsx
- src/react-app/pages/DocumentDetail.tsx
- src/react-app/lib/client-balances.ts
- tests/auth.setup.ts, tests/firebase-test-utils.ts

Impact
- Fixes runtime errors and TS build failures
- Enables consistent queries and adapter usage
- Improves developer experience; removes security risk of test creds

Acceptance
- tsc passes
- Notifications panel works (load, mark read, delete)
- Dashboard counts compute without Query typing errors
- Billing “Client Balances” link navigates correctly

Follow-ups
- Ensure code that writes notifications sets created_at
- Expand Query adapter to support more complex filters where required
