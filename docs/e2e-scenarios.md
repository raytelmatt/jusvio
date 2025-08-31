# E2E Scenarios for Jusivo

These scenarios cover Login, New Client, Upload Document, and Generate Document flows using exact UI text and routes from the app.

Base URL will be either your local ngrok URL (for local runs) or your production domain deployed on Appwrite Sites.

- BASE_URL: `https://YOUR_NGROK_SUBDOMAIN.ngrok-free.app` or `https://YOUR_PROD_DOMAIN`
- Appwrite Endpoint: https://nyc.cloud.appwrite.io/v1
- Appwrite Project ID: `6897443a0034c54b3fd8`

Test credentials (configure in your test runner or environment):

- TEST_USER_EMAIL
- TEST_USER_PASSWORD

---

## 1) Login

Preconditions

- A valid Appwrite user exists with email/password.

Steps

1. Navigate to `${BASE_URL}/login`.
2. In the input labeled "Email" with placeholder "you@example.com", type secret TEST_USER_EMAIL.
3. In the input labeled "Password", type secret TEST_USER_PASSWORD.
4. Click the button with text "Sign in".
5. Expect a redirect to `/` (dashboard). Verify the sidebar shows links "Dashboard", "Clients", "Matters", "Documents", etc.

---

## 2) Create New Client

Preconditions

- Logged in (reuse Login scenario).

Steps

1. Navigate to `${BASE_URL}/clients`.
2. Click the button with text "Add Client".
3. On `${BASE_URL}/clients/new`, fill the form:
   - "First Name *": John
   - "Last Name *": Doe
   - "Date of Birth": 1990-05-15
   - "SSN (Last 4 digits)": 1234
   - "Email": `john.doe@example.com`
   - "Phone": 555-123-4567
   - "Preferred Contact Method": Email
   - "Street Address": 123 Main St
   - "City": Nashville
   - "State": TN
   - "ZIP Code": 37201
   - Emergency Contact:
     - "Name": Jane Doe
     - "Relationship": Spouse
     - "Phone": 555-765-4321
4. Click the button with text "Create Client".
5. Expect navigation back to clients list. Verify a row appears with name "John Doe".

---

## 3) Upload Document

Preconditions

- Logged in.
- At least one Matter exists (see Optional: Sample Data below).
- A sample file available to upload (e.g., test.pdf).

Steps

1. Navigate to `${BASE_URL}/documents/upload`.
2. In "Matter *", select the existing Matter by its title.
3. In "File *", attach file `test.pdf`.
4. In "Document Title *", type "Police Report".
5. In "Status", select "Draft" (if present).
6. Click the button "Upload Document".
7. Expect success (redirect to "/documents" or success indicator). Verify "Police Report" appears in the documents list.

---

## 4) Generate Document

Preconditions

- Logged in.
- At least one Document Template exists with variables, and at least one Matter exists.

Steps

1. Navigate to `${BASE_URL}/documents/generate`.
2. In "Matter *", select the existing Matter.
3. In "Template *", select the template (e.g., "Engagement Letter").
4. In "Document Title *", accept the prefilled name or type a title.
5. In "Template Variables", fill every required variable input. Example:
   - "Client Name *": John Doe
   - "Case Number *": 2025-0001
6. Click the button "Generate Document".
7. Expect a success banner "Document Generated Successfully" and a download to start; after ~1.2s a redirect to "/documents" occurs. Verify the new document appears in the list.

---

## Local Run + ngrok

1. Create `.env.local` with:
   - `VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1`
   - `VITE_APPWRITE_PROJECT_ID=6897443a0034c54b3fd8`
2. Start dev server: `npm run dev` (Vite on 5173).
3. Expose locally: `ngrok http 5173`.
4. Use your HTTPS forwarding URL as `${BASE_URL}` for your E2E runs.

## Appwrite CORS for ngrok

- Appwrite Console → Project → Settings → Web → Allowed Origins → add your ngrok origin, for example: `https://YOUR_NGROK_SUBDOMAIN.ngrok-free.app`.
- Also add your production domain.

## Optional: Sample Data

For local testing, create minimal sample records using the Appwrite Console:

- Create a client (e.g., John Doe).
- Create a matter linked to the client (e.g., TEST-0001).
- Create a document template (e.g., "Engagement Letter") and define variables as needed (e.g., ["client_name", "case_number"]).

## Notes

- Router: `App.tsx` uses `BrowserRouter` from `react-router`; pages use hooks from `react-router`. This is correct for v7.
- Add small assertion retries in your E2E tests for lists to handle Appwrite indexing latency.
