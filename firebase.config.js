// import { getAnalytics } from "firebase/analytics";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGZdUbOC9A-cW9TifDGHjsy9AryU89Oh8",
  authDomain: "sandrin-app.firebaseapp.com",
  projectId: "sandrin-app",
  messagingSenderId: "515361979527",
  appId: "1:515361979527:web:fd4b07d82562e464c44c22",
  measurementId: "G-N0KCWR4M5Q"
};

// Initialize Firebase
// const analytics = getAnalytics(app);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
