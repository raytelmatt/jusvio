import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import App from "@/react-app/App.tsx";
import { getFirebaseApp, getFirebaseAnalytics } from "@/react-app/lib/firebase";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Initialize Firebase and analytics in the background
try {
  getFirebaseApp();
  void getFirebaseAnalytics();
} catch {}
