import { createSign } from "crypto";

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getMuxSigningPrivateKey() {
  const privateKey = process.env.MUX_SIGNING_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!privateKey || privateKey.includes("BEGIN")) {
    return privateKey;
  }

  return Buffer.from(privateKey, "base64").toString("utf8");
}

function hasRealMuxSigningValue(value: string | undefined) {
  return Boolean(value && value.trim() !== "..." && !value.startsWith("your_"));
}

export function hasMuxSigningConfig() {
  return hasRealMuxSigningValue(process.env.MUX_SIGNING_KEY_ID) &&
    hasRealMuxSigningValue(getMuxSigningPrivateKey());
}

export function createMuxPlaybackToken(playbackId: string, expiresInSeconds = 600) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const privateKey = getMuxSigningPrivateKey();

  if (!keyId || !privateKey) {
    throw new Error("Mux signing credentials are not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    kid: keyId,
    typ: "JWT",
  };
  const payload = {
    aud: "v",
    iat: now,
    exp: now + expiresInSeconds,
    kid: keyId,
    sub: playbackId,
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  return `${unsignedToken}.${base64UrlEncode(signer.sign(privateKey))}`;
}
