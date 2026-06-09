import { NextResponse } from "next/server";
import { hasMuxSigningConfig } from "@/lib/muxSigning";

export function GET() {
  const checks = {
    contentful: Boolean(process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_DELIVERY_TOKEN),
    firebase: Boolean(process.env.FIREBASE_PROJECT_ID),
    appCheck: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY),
    muxPlayback: hasMuxSigningConfig(),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    legalIdentity: Boolean(
      process.env.LEGAL_PROVIDER_NAME
      && process.env.LEGAL_PROVIDER_ADDRESS
      && process.env.LEGAL_PROVIDER_EMAIL
      && process.env.LEGAL_RESPONSIBLE_PERSON
    ),
  };
  const healthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
