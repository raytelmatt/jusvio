// Firebase client initialization
// Uses project-provided config; safe to import from SPA entry to enable analytics.

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

function env(name: string, fallback: string) {
  try {
    const meta = import.meta as unknown as { env?: Record<string, unknown> };
    const value = meta.env?.[`VITE_${name}`];
    return typeof value === 'string' ? value : fallback;
  } catch {
    return fallback;
  }
}

const firebaseConfig = {
  apiKey: env('FIREBASE_API_KEY', "AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g"),
  authDomain: env('FIREBASE_AUTH_DOMAIN', "jusivo.firebaseapp.com"),
  projectId: env('FIREBASE_PROJECT_ID', "jusivo"),
  storageBucket: env('FIREBASE_STORAGE_BUCKET', "jusivo.appspot.com"),
  messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID', "829325582202"),
  appId: env('FIREBASE_APP_ID', "1:829325582202:web:07b6036fa03e2df73f40c3"),
  measurementId: env('FIREBASE_MEASUREMENT_ID', "G-1L2R9BGTM1"),
};

// Log configuration in development to help with debugging
if (import.meta.env.DEV) {
  console.log('Firebase config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey.substring(0, 10) + '...' // Don't log full API key
  });
}

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let initializationError: Error | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (initializationError) {
    throw initializationError;
  }
  
  if (!app) {
    try {
      // Validate required configuration
      if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        throw new Error('Missing required Firebase configuration. Please check your environment variables.');
      }
      
      app = initializeApp(firebaseConfig);
      
      // Initialize services with better error handling
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      
      // Set up auth state persistence with better error handling
      try {
        if (auth.setPersistence) {
          auth.setPersistence({
            type: 'LOCAL'
          }).catch(err => {
            console.warn('Failed to set auth persistence:', err);
            // Continue without persistence if it fails
          });
        }
      } catch (err) {
        console.warn('Failed to set auth persistence:', err);
        // Continue without persistence if it fails
      }
      
      // Configure auth settings for better reliability
      auth.settings.appVerificationDisabledForTesting = false;
      
      // Set custom timeout for network requests
      auth.tenantId = null; // Ensure no tenant ID issues
      
      console.log('Firebase app initialized successfully');
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error('Firebase initialization failed');
      console.error('Firebase initialization error:', initializationError);
      throw initializationError;
    }
  }
  return app;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analytics) return analytics;
  try {
    if (await isSupported()) {
      analytics = getAnalytics(getFirebaseApp());
      return analytics;
    }
    return null;
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
    return null;
  }
}

// Helper function to check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  try {
    getFirebaseApp();
    return true;
  } catch {
    return false;
  }
}

// Reset initialization state (useful for testing)
export function resetFirebaseApp(): void {
  app = null;
  analytics = null;
  initializationError = null;
}
