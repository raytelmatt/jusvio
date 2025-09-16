# Backend Architecture Guide

The Jusivo Case Manager now relies exclusively on Firebase for authentication, Firestore for data, and Cloud Storage for files. This document summarizes the pieces you need to configure when deploying to a new environment.

## Overview

- `src/react-app/lib/backend/firebase-adapter.ts` implements the backend abstraction backed by Firebase SDKs.
- `src/react-app/lib/backend/index.ts` wires configuration from Vite environment variables and exports a singleton service used throughout the app.
- `src/react-app/lib/firebase.ts` initializes the Firebase Web SDK (used for analytics and client-side helpers).

## Environment Variables

Create a `.env.local` (or supply variables through your hosting platform) with at least the following values:

```bash
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

For server-side scripts such as `npm run firebase:seed`, provide either a base64 encoded service account JSON or a path to the credentials file:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_SERVICE_ACCOUNT=base64-encoded-json
# or
SERVICE_ACCOUNT_KEY_PATH=/absolute/path/to/serviceAccount.json
```

## Seeding Firestore

Use `npm run firebase:seed` to ensure required collections exist and to insert sample data. The script reads the same environment variables described above and uses the Admin SDK to create collections such as `clients`, `matters`, `documents`, `deadlines`, and more (see `scripts/firebase/seed-firestore.mjs`).

## Switching From Another Backend

If you previously ran the app against Appwrite or another provider, remove any old environment variables and secrets, then redeploy with the Firebase variables. The backend factory no longer supports pluggable adapters; every `databases.*`, `storage.*`, and `account.*` call now targets Firebase.

## Deployment

- Build with `npm run build`.
- Deploy with `npm run deploy` (uses Firebase Hosting CLI and respects `FIREBASE_PROJECT_ID`).

With these steps configured, the SPA will authenticate users via Firebase Auth and read/write data in Firestore across all pages (clients, matters, documents, billing, etc.).
