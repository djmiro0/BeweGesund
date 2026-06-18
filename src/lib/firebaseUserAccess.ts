import type { MemberPackage } from "@/data";
import { normalizeMemberPackage } from "@/lib/memberPackages";

interface FirestoreDocument {
  fields?: {
    memberPackage?: { stringValue?: string };
    subscriptionStatus?: { stringValue?: string };
  };
}

export interface FirebaseUserAccess {
  memberPackage: MemberPackage;
  subscriptionStatus: string;
}

export async function getFirebaseUserAccess(
  uid: string,
  idToken: string,
): Promise<FirebaseUserAccess> {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? "sandrin-app";
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Firebase user profile could not be loaded (${response.status}).`);
  }

  const document = (await response.json()) as FirestoreDocument;

  return {
    memberPackage: normalizeMemberPackage(document.fields?.memberPackage?.stringValue),
    subscriptionStatus: document.fields?.subscriptionStatus?.stringValue ?? "free",
  };
}
