# Backend Migration Guide

This guide explains how to migrate the Jusivo Case Manager from Appwrite to another backend service.

## Overview

The codebase has been refactored to use a backend abstraction layer that makes it easy to swap out Appwrite for other services like Firebase, Supabase, or a custom REST API.

## Architecture

### Backend Abstraction Layer

The abstraction layer consists of:

- **`src/react-app/lib/backend/types.ts`** - Interface definitions for all backend services
- **`src/react-app/lib/backend/appwrite-adapter.ts`** - Appwrite implementation
- **`src/react-app/lib/backend/index.ts`** - Service factory and configuration

### Key Interfaces

1. **`BackendAuthService`** - Authentication (login, logout, JWT management)
2. **`BackendDatabaseService`** - Database operations (CRUD, queries)
3. **`BackendStorageService`** - File storage (upload, download, delete)
4. **`BackendService`** - Main service combining all sub-services

## Migration Steps

### 1. Choose Your Backend Provider

Set the `VITE_BACKEND_PROVIDER` environment variable:

```bash
# For Firebase
VITE_BACKEND_PROVIDER=firebase

# For Supabase  
VITE_BACKEND_PROVIDER=supabase

# For custom REST API
VITE_BACKEND_PROVIDER=custom
```

### 2. Configure Environment Variables

#### Firebase Configuration
```bash
VITE_BACKEND_PROVIDER=firebase
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

#### Supabase Configuration
```bash
VITE_BACKEND_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Custom REST API Configuration
```bash
VITE_BACKEND_PROVIDER=custom
VITE_CUSTOM_API_ENDPOINT=https://your-api.com
VITE_CUSTOM_PROJECT_ID=your-project-id
VITE_CUSTOM_API_KEY=your-api-key
```

### 3. Implement Backend Adapter

Create a new adapter file (e.g., `firebase-adapter.ts`) that implements the `BackendService` interface:

```typescript
import type { BackendService } from './types';

export class FirebaseBackendService implements BackendService {
  // Implement all required methods
  auth: BackendAuthService;
  database: BackendDatabaseService;
  storage: BackendStorageService;
  Query: any;
  
  setJWT(jwt: string | null): void {
    // Implementation
  }
}
```

### 4. Update Service Factory

Add your new adapter to `src/react-app/lib/backend/index.ts`:

```typescript
case 'firebase':
  return new FirebaseBackendService(config);
```

### 5. Database Schema Migration

The database schema is defined in the following collections:

- `clients` - Client information and contact details
- `matters` - Legal cases and matter details  
- `hearings` - Court hearings and appointments
- `documents` - Document metadata and storage references
- `deadlines` - Important dates and deadlines
- `time_entries` - Time tracking for billing
- `invoices` - Billing and payment information
- `communications` - Client communications log
- `notifications` - System notifications

Refer to `scripts/appwrite/setup.mjs` for detailed schema definitions.

### 6. Update Deployment Configuration

#### GitHub Actions

Replace `.github/workflows/deploy-appwrite.yml` with your new deployment workflow:

```yaml
name: Deploy to [Your Service]
on:
  push:
    branches: [ "main" ]
env:
  # Your service-specific environment variables
jobs:
  deploy:
    # Your deployment steps
```

#### Environment Files

Update `.env.example` with your new backend configuration:

```bash
# Backend Provider Configuration
VITE_BACKEND_PROVIDER=firebase

# Firebase Configuration (example)
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_API_KEY=
# ... other variables
```

## Implementation Status

### ✅ Completed
- Backend abstraction interfaces defined
- Appwrite adapter implemented
- Service factory with environment-based configuration
- Legacy compatibility layer for gradual migration

### 🚧 TODO (for specific backends)
- Firebase adapter implementation
- Supabase adapter implementation  
- Custom REST API adapter implementation
- Database migration scripts for each backend
- Updated deployment workflows

## Testing Migration

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Type Checking**
   ```bash
   npm run build:check
   ```

3. **Linting**
   ```bash
   npm run lint
   ```

## File Locations to Update

When implementing a new backend, you'll primarily work with:

- `src/react-app/lib/backend/` - Backend abstraction layer
- `src/react-app/auth/AuthProvider.tsx` - May need updates for auth flow
- `.env.example` - Environment variable documentation
- `.github/workflows/` - Deployment configuration
- `scripts/` - Database setup and migration scripts

## Support

The abstraction layer is designed to make backend migration straightforward. All existing application code continues to work unchanged - only the backend implementation changes.

For questions or issues during migration, refer to the interface definitions in `types.ts` which document the expected behavior of each backend service.
