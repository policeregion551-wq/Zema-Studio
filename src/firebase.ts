import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDQGpzxRtN76dWToC6udDA0FuqXEGHw28M",
  authDomain: "zema-studio-1ab0c.firebaseapp.com",
  projectId: "zema-studio-1ab0c",
  storageBucket: "zema-studio-1ab0c.firebasestorage.app",
  messagingSenderId: "830111874880",
  appId: "1:830111874880:web:27bbe9f6eaa8e176c804a5",
  measurementId: "G-E6QXYFT2YH",
};

export const firebaseApp = initializeApp(firebaseConfig);

let analyticsInstance: Analytics | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(firebaseApp);
    }
  } catch {
    // Analytics disabled or blocked by browser privacy settings
  }
  return analyticsInstance;
}
