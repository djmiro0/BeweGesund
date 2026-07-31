import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebaseToken";
import { getFirebaseUserAccess } from "@/lib/firebaseUserAccess";
import { packageRank } from "@/lib/memberPackages";
import { createMuxPlaybackToken, hasMuxSigningConfig } from "@/lib/muxSigning";
import { consumeRateLimit } from "@/lib/serverRateLimit";
import { getCourseDetail, getMeditationRelaxationItem } from "@/lib/contentful";

export const runtime = "nodejs";

interface PlaybackTokenRequest {
  playbackId?: string;
  courseSlug?: string;
  contentType?: "course" | "meditationRelaxation";
  locale?: string;
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
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!idToken) {
    return NextResponse.json(
      { error: "Authentication is required.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  let uid: string;

  try {
    ({ uid } = await verifyFirebaseIdToken(idToken));
  } catch {
    return NextResponse.json(
      { error: "Invalid authentication token.", code: "INVALID_AUTH_TOKEN" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as PlaybackTokenRequest;
  const playbackId = body.playbackId?.trim();
  const courseSlug = body.courseSlug?.trim();
  const contentType =
    body.contentType === "meditationRelaxation"
      ? "meditationRelaxation"
      : "course";
  const locale = body.locale === "de" ? "de" : "en";

  if (!playbackId || !courseSlug) {
    return NextResponse.json(
      {
        error: "playbackId and courseSlug are required.",
        code: "PLAYBACK_REQUEST_INVALID",
      },
      { status: 400 },
    );
  }

  const rateLimit = consumeRateLimit(`mux-playback:${uid}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many playback requests.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const [content, userAccess] = await Promise.all([
      contentType === "meditationRelaxation"
        ? getMeditationRelaxationItem(locale, courseSlug)
        : getCourseDetail(locale, courseSlug),
      getFirebaseUserAccess(uid, idToken),
    ]);

    if (!content || content.muxPlaybackId !== playbackId) {
      return NextResponse.json(
        {
          error: "The requested video is not available.",
          code: "VIDEO_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (
      userAccess.subscriptionStatus !== "active" &&
      userAccess.subscriptionStatus !== "trialing"
    ) {
      return NextResponse.json(
        {
          error: "An active membership is required.",
          code: "SUBSCRIPTION_REQUIRED",
        },
        { status: 403 },
      );
    }

    if (
      packageRank[userAccess.memberPackage] <
      packageRank[content.packageRequired]
    ) {
      return NextResponse.json(
        {
          error: "Your membership does not include this video.",
          code: "PACKAGE_REQUIRED",
        },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error("Mux playback access check failed.", {
      uid,
      courseSlug,
      contentType,
      locale,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Video access could not be verified.",
        code: "ACCESS_CHECK_FAILED",
      },
      { status: 503 },
    );
  }

  let playbackToken: string;

  try {
    playbackToken = createMuxPlaybackToken(playbackId);
  } catch {
    return NextResponse.json(
      {
        error: "Mux playback token could not be signed.",
        code: "MUX_TOKEN_SIGNING_FAILED",
      },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    playbackToken,
    expiresInSeconds: 600,
  });

  response.headers.set("Cache-Control", "no-store");

  return response;
}
