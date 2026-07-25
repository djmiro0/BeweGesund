import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { consumeRateLimit } from "@/lib/serverRateLimit";

function isAuthorized(value: string, expected: string) {
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  const adminToken = process.env.MUX_ADMIN_UPLOAD_TOKEN;

  if (!tokenId || !tokenSecret || !adminToken) {
    return NextResponse.json(
      { error: "Mux credentials are not configured." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!isAuthorized(authorization, `Bearer ${adminToken}`)) {
    return NextResponse.json(
      { error: "Not allowed to create uploads." },
      { status: 403 },
    );
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredOrigin) {
    return NextResponse.json(
      { error: "The production site URL is not configured." },
      { status: 500 },
    );
  }

  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(configuredOrigin).origin) {
    return NextResponse.json(
      { error: "Upload origin is not allowed." },
      { status: 403 },
    );
  }

  const clientAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = consumeRateLimit(`mux-upload:${clientAddress}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many upload requests." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const credentials = Buffer.from(`${tokenId}:${tokenSecret}`).toString(
    "base64",
  );

  const response = await fetch("https://api.mux.com/video/v1/uploads", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cors_origin: new URL(configuredOrigin).origin,
      new_asset_settings: {
        playback_policies: ["signed"],
        video_quality: "basic",
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: "Mux upload creation failed.", details: payload },
      { status: response.status },
    );
  }

  return NextResponse.json({
    id: payload.data.id,
    url: payload.data.url,
    status: payload.data.status,
  });
}
