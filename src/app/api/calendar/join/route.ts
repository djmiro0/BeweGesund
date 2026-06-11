import { NextResponse } from "next/server";
import { getCalendarDays } from "@/lib/contentful";
import { getFirebaseUserAccess } from "@/lib/firebaseUserAccess";
import { verifyFirebaseIdToken } from "@/lib/firebaseToken";
import { packageRank } from "@/lib/memberPackages";
import { consumeRateLimit } from "@/lib/serverRateLimit";

interface JoinRequest {
  eventId?: string;
  locale?: string;
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const appCheckToken = request.headers.get("x-firebase-appcheck") ?? "";
  const idToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!idToken) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  let uid: string;
  try {
    ({ uid } = await verifyFirebaseIdToken(idToken));
  } catch {
    return NextResponse.json({ error: "Invalid authentication token." }, { status: 401 });
  }

  const rateLimit = consumeRateLimit(`calendar-join:${uid}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many join requests." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as JoinRequest;
  const eventId = body.eventId?.trim();
  const locale = body.locale === "de" ? "de" : "en";

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required." }, { status: 400 });
  }

  try {
    const days = await getCalendarDays(locale).catch(() => {
      throw new Error("CALENDAR_CONTENT_UNAVAILABLE");
    });
    const userAccess = await getFirebaseUserAccess(uid, idToken, appCheckToken).catch(() => {
      throw new Error("USER_ACCESS_UNAVAILABLE");
    });
    const event = days.flatMap((day) => day.entries).find((entry) => entry.id === eventId);

    if (!event?.liveTrainingLink) {
      return NextResponse.json({ error: "The session link is not available." }, { status: 404 });
    }

    if (userAccess.subscriptionStatus !== "active" && userAccess.subscriptionStatus !== "trialing") {
      return NextResponse.json({ error: "An active membership is required." }, { status: 403 });
    }

    if (packageRank[userAccess.memberPackage] < packageRank[event.packageRequired]) {
      return NextResponse.json({ error: "Your membership does not include this session." }, { status: 403 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bewegesund.de";
    const target = new URL(event.liveTrainingLink, siteUrl);
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return NextResponse.json({ error: "The session link is invalid." }, { status: 400 });
    }

    return NextResponse.json(
      { url: target.toString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "CALENDAR_CONTENT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Calendar content is temporarily unavailable.", code: "CALENDAR_CONTENT_UNAVAILABLE" },
        { status: 503 },
      );
    }

    if (message === "USER_ACCESS_UNAVAILABLE") {
      return NextResponse.json(
        {
          error: "Membership access could not be verified.",
          code: "USER_ACCESS_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Session access could not be verified.", code: "SESSION_ACCESS_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
