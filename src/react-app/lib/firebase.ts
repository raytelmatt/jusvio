// Firebase client initialization
// Uses project-provided config; safe to import from SPA entry to enable analytics.

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

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

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
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
  } catch {
    return null;
  }
}
