import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const serverTimestamp = FieldValue.serverTimestamp;
export const increment = FieldValue.increment;

export const USERS_COLLECTION = "users";
export const REWARDS_COLLECTION = "rewards";
export const LEADERBOARDS_COLLECTION = "leaderboards";

export function userRef(uid: string) {
  return db.collection(USERS_COLLECTION).doc(uid);
}
