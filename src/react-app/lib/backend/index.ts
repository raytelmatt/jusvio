
import type { BackendService, BackendConfig } from './types';
import { FirebaseBackendService } from './firebase-adapter';

function getEnv(name: string, fallback?: string): string {
  const key = `VITE_${name}` as keyof ImportMetaEnv;
  const val = import.meta.env?.[key];
  return (val as string) || fallback || '';
}

function createBackendConfig(): BackendConfig {
  const provider = getEnv('BACKEND_PROVIDER', 'firebase') as BackendConfig['provider'];
  
  switch (provider) {
    case 'firebase':
      // Provide sane defaults matching local firebase.ts to avoid blank pages in dev
      return {
        provider: 'firebase',
        projectId: getEnv('FIREBASE_PROJECT_ID', 'jusivo'),
        apiKey: getEnv('FIREBASE_API_KEY', 'AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g'),
        authDomain: getEnv('FIREBASE_AUTH_DOMAIN', 'jusivo.firebaseapp.com'),
        databaseURL: getEnv('FIREBASE_DATABASE_URL', ''),
        storageBucket: getEnv('FIREBASE_STORAGE_BUCKET', 'jusivo.appspot.com'),
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
      throw new Error(`Unsupported backend provider: ${provider}. Only 'firebase', 'supabase', and 'custom' are supported.`);
  }
}

function createBackendService(config: BackendConfig): BackendService {
  switch (config.provider) {
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
