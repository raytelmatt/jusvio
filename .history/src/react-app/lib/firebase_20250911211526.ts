// Firebase client initialization
// Uses project-provided config; safe to import from SPA entry to enable analytics.

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g",
  authDomain: "jusivo.firebaseapp.com",
  projectId: "jusivo",
  storageBucket: "jusivo.appspot.com",
  messagingSenderId: "829325582202",
  appId: "1:829325582202:web:07b6036fa03e2df73f40c3",
  measurementId: "G-1L2R9BGTM1"
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


