import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebaseToken";
import { createMuxPlaybackToken, hasMuxSigningConfig } from "@/lib/muxSigning";

export const runtime = "nodejs";

interface PlaybackTokenRequest {
  playbackId?: string;
}

export async function POST(request: Request) {
  if (!hasMuxSigningConfig()) {
    return NextResponse.json(
      {
        error: "Mux signing is not configured.",
        code: "MUX_SIGNING_NOT_CONFIGURED",
      },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  const idToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";

  if (!idToken) {
    return NextResponse.json(
      { error: "Authentication is required.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  try {
    await verifyFirebaseIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: "Invalid authentication token.", code: "INVALID_AUTH_TOKEN" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as PlaybackTokenRequest;
  const playbackId = body.playbackId?.trim();

  if (!playbackId) {
    return NextResponse.json(
      { error: "playbackId is required.", code: "PLAYBACK_ID_REQUIRED" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    playbackToken: createMuxPlaybackToken(playbackId),
    expiresInSeconds: 600,
  });
}
