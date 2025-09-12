
import type { BackendService, BackendConfig } from './types';
import { AppwriteBackendService } from './appwrite-adapter';
import { FirebaseBackendService } from './firebase-adapter';

function getEnv(name: string, fallback?: string): string {
  const key = `VITE_${name}` as keyof ImportMetaEnv;
  const val = import.meta.env?.[key];
  return (val as string) || fallback || '';
}

function createBackendConfig(): BackendConfig {
  const provider = getEnv('BACKEND_PROVIDER', 'appwrite') as BackendConfig['provider'];
  
  switch (provider) {
    case 'appwrite':
      return {
        provider: 'appwrite',
        endpoint: getEnv('APPWRITE_ENDPOINT', 'https://nyc.cloud.appwrite.io/v1'),
        projectId: getEnv('APPWRITE_PROJECT_ID', '6897443a0034c54b3fd8'),
      };
    
    case 'firebase':
      return {
        provider: 'firebase',
        projectId: getEnv('FIREBASE_PROJECT_ID', ''),
        apiKey: getEnv('FIREBASE_API_KEY', ''),
        authDomain: getEnv('FIREBASE_AUTH_DOMAIN', ''),
        databaseURL: getEnv('FIREBASE_DATABASE_URL', ''),
        storageBucket: getEnv('FIREBASE_STORAGE_BUCKET', ''),
      };
    
    case 'supabase':
      return {
        provider: 'supabase',
        endpoint: getEnv('SUPABASE_URL', ''),
        projectId: getEnv('SUPABASE_PROJECT_ID', ''),
        apiKey: getEnv('SUPABASE_ANON_KEY', ''),
      };
    
    case 'custom':
      return {
        provider: 'custom',
        endpoint: getEnv('CUSTOM_API_ENDPOINT', ''),
        projectId: getEnv('CUSTOM_PROJECT_ID', ''),
        apiKey: getEnv('CUSTOM_API_KEY', ''),
      };
    
    default:
      throw new Error(`Unsupported backend provider: ${provider}`);
  }
}

function createBackendService(config: BackendConfig): BackendService {
  switch (config.provider) {
    case 'appwrite':
      return new AppwriteBackendService(config);
    
    case 'firebase':
      return new FirebaseBackendService(config);
    
    case 'supabase':
      throw new Error('Supabase backend adapter not yet implemented');
    
    case 'custom':
      throw new Error('Custom backend adapter not yet implemented');
    
    default:
      throw new Error(`Unsupported backend provider: ${config.provider}`);
  }
}

let backendService: BackendService | null = null;

export function getBackendService(): BackendService {
  if (!backendService) {
    const config = createBackendConfig();
    backendService = createBackendService(config);
  }
  return backendService;
}

export * from './types';
export { DATABASE_ID, COLLECTIONS, BUCKETS } from './types';

export const backend = getBackendService();
export const account = backend.auth;
export const databases = backend.database;
export const storage = backend.storage;
export const Query = backend.Query;

export function setClientJWT(jwt: string | null) {
  backend.setJWT(jwt);
}
