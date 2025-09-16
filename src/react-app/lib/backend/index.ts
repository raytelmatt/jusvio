
import type { BackendService, BackendConfig } from './types';
import { FirebaseBackendService } from './firebase-adapter';

function getEnv(name: string, fallback?: string): string {
  const key = `VITE_${name}` as keyof ImportMetaEnv;
  const val = import.meta.env?.[key];
  return (val as string) || fallback || '';
}

function createBackendConfig(): BackendConfig {
  // Provide sane defaults matching local firebase.ts to avoid blank pages in dev
  return {
    projectId: getEnv('FIREBASE_PROJECT_ID', 'jusivo'),
    apiKey: getEnv('FIREBASE_API_KEY', 'AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g'),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN', 'jusivo.firebaseapp.com'),
    databaseURL: getEnv('FIREBASE_DATABASE_URL', ''),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET', 'jusivo.appspot.com'),
  };
}

function createBackendService(config: BackendConfig): BackendService {
  return new FirebaseBackendService(config);
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
