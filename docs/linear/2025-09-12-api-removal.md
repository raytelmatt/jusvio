Title: [FEATURE] Replace REST /api usage with backend adapter (Calendar, Hearings, Client Portal)

Summary
- Calendar now queries hearings via adapter with date range and optional practice area filters
- New Hearing creates hearing via databases.createDocument; matters loaded via adapter
- Client Portal aggregates client, matters, documents, communications, invoices, and upcoming hearings using adapter; no server required
- Client Portal Login searches clients (email/phone/name) via adapter and routes to portal

Files (key)
- src/react-app/pages/Calendar.tsx
- src/react-app/pages/NewHearing.tsx
- src/react-app/pages/ClientPortal.tsx
- src/react-app/pages/ClientPortalLogin.tsx

Impact
- Removes dependency on unimplemented REST endpoints
- Makes app Replit-friendly and portable

Acceptance
- Calendar grid renders hearings for current month
- New hearing form saves and redirects to Calendar
- Client portal loads all tabs for an existing client
- Login search finds a client and routes

Follow-ups
- Convert IntakeForm, CriminalIntakeForm, PersonalInjury to use adapter or add simple intake collection
- Add server validation if needed later
