import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/serverRateLimit";

interface NewsletterRequest {
  email?: string;
  website?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_CONTACTS_URL = "https://api.resend.com/contacts";

function resendHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = consumeRateLimit(`newsletter:${ip}`, 8, 15 * 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many newsletter requests." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = (await request.json().catch(() => ({}))) as NewsletterRequest;

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const email = body.email?.trim().toLowerCase() ?? "";

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Invalid newsletter request." },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.RESEND_CONTACTS_API_KEY?.trim() ||
    process.env.RESEND_API_KEY?.trim();
  const topicId = process.env.RESEND_NEWSLETTER_TOPIC_ID?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Newsletter delivery is not configured.",
        code: "NEWSLETTER_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const headers = resendHeaders(apiKey);
  const contactUrl = `${RESEND_CONTACTS_URL}/${encodeURIComponent(email)}`;
  const lookupResponse = await fetch(contactUrl, { headers });
  let response: Response;

  if (lookupResponse.status === 404) {
    response = await fetch(RESEND_CONTACTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        unsubscribed: false,
        ...(topicId
          ? { topics: [{ id: topicId, subscription: "opt_in" }] }
          : {}),
      }),
    });
  } else if (lookupResponse.ok) {
    response = await fetch(contactUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ unsubscribed: false }),
    });

    if (response.ok && topicId) {
      response = await fetch(`${contactUrl}/topics`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          topics: [{ id: topicId, subscription: "opt_in" }],
        }),
      });
    }
  } else {
    response = lookupResponse;
  }

  if (!response.ok) {
    console.error("Newsletter subscription failed through Resend.", {
      status: response.status,
      statusText: response.statusText,
    });

    return NextResponse.json(
      {
        error: "Newsletter subscription failed.",
        code: "NEWSLETTER_SUBSCRIPTION_FAILED",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
