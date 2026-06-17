import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/serverRateLimit";

interface ContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  message?: string;
  locale?: string;
  website?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTopics = new Set(["consultation", "courses", "business", "other"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const rateLimit = consumeRateLimit(`contact:${ip}`, 5, 15 * 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many contact requests." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as ContactRequest;

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const topic = body.topic?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const locale = body.locale === "en" ? "en" : "de";

  if (
    name.length < 2
    || name.length > 120
    || !EMAIL_PATTERN.test(email)
    || email.length > 254
    || phone.length > 60
    || !allowedTopics.has(topic)
    || message.length < 10
    || message.length > 5000
  ) {
    return NextResponse.json({ error: "Invalid contact request." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_EMAIL_FROM?.trim();
  const to = process.env.CONTACT_EMAIL_TO?.trim() || "info@bewegesund.de";

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Contact delivery is not configured.", code: "CONTACT_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const subject = `[BeweGesund] ${topic} - ${name}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "-"}`,
        `Topic: ${topic}`,
        `Locale: ${locale}`,
        "",
        message,
      ].join("\n"),
      html: `
        <h2>BeweGesund contact request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "-")}</p>
        <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
        <p><strong>Locale:</strong> ${locale}</p>
        <hr />
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("Contact delivery failed through Resend.", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody.slice(0, 800),
    });

    return NextResponse.json(
      { error: "Contact delivery failed.", code: "CONTACT_DELIVERY_FAILED" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
