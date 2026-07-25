import { createVerify } from "crypto";

interface FirebaseTokenHeader {
  alg?: string;
  kid?: string;
}

interface FirebaseTokenPayload {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  user_id?: string;
}

let cachedCerts: { expiresAt: number; value: Record<string, string> } | null =
  null;

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function parseJwtPart<T>(value: string): T {
  return JSON.parse(base64UrlDecode(value)) as T;
}

async function getFirebaseCerts() {
  const now = Date.now();

  if (cachedCerts && cachedCerts.expiresAt > now) {
    return cachedCerts.value;
  }

  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
  );

  if (!response.ok) {
    throw new Error("Firebase public certificates could not be loaded.");
  }

  const maxAge = response.headers
    .get("cache-control")
    ?.match(/max-age=(\d+)/)?.[1];
  const expiresAt = now + Number(maxAge ?? 3600) * 1000;
  const value = (await response.json()) as Record<string, string>;
  cachedCerts = { expiresAt, value };

  return value;
}

export async function verifyFirebaseIdToken(idToken: string) {
  const [encodedHeader, encodedPayload, signature] = idToken.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Invalid Firebase token format.");
  }

  const header = parseJwtPart<FirebaseTokenHeader>(encodedHeader);
  const payload = parseJwtPart<FirebaseTokenPayload>(encodedPayload);
  const projectId = process.env.FIREBASE_PROJECT_ID ?? "sandrin-app";
  const now = Math.floor(Date.now() / 1000);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Invalid Firebase token header.");
  }

  if (
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    !payload.sub ||
    !payload.exp ||
    payload.exp <= now
  ) {
    throw new Error("Invalid Firebase token payload.");
  }

  const certs = await getFirebaseCerts();
  const cert = certs[header.kid];

  if (!cert) {
    throw new Error("Firebase token certificate was not found.");
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const isValid = verifier.verify(
    cert,
    signature.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  );
  if (!isValid) {
    throw new Error("Firebase token signature is invalid.");
  }

  return {
    uid: payload.user_id ?? payload.sub,
  };
}
