import { initializeApp, getApps } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGZdUbOC9A-cW9TifDGHjsy9AryU89Oh8",
  authDomain: "sandrin-app.firebaseapp.com",
  projectId: "sandrin-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sandrin-app.firebasestorage.app",
  messagingSenderId: "515361979527",
  appId: "1:515361979527:web:fd4b07d82562e464c44c22",
  measurementId: "G-N0KCWR4M5Q"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
const appCheckEnabled = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED === "true";
const appCheckDebugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;

if (
  typeof window !== "undefined"
  && appCheckEnabled
  && appCheckSiteKey
  && !window.__BEWEGESUND_APP_CHECK_INITIALIZED__
) {
  if (appCheckDebugToken) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = appCheckDebugToken === "true" ? true : appCheckDebugToken;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  window.__BEWEGESUND_APP_CHECK_INITIALIZED__ = true;
}

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const functions = getFunctions(app, "europe-west3");
export const storage = getStorage(app);
