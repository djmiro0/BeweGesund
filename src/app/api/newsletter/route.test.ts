import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function newsletterRequest(overrides: Record<string, unknown> = {}) {
  return new Request("https://bewegesund.de/api/newsletter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify({
      email: "member@example.com",
      ...overrides,
    }),
  });
}

describe("newsletter route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects an invalid email address", async () => {
    const response = await POST(newsletterRequest({ email: "invalid" }));

    expect(response.status).toBe(400);
  });

  it("accepts honeypot submissions without contacting the provider", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(newsletterRequest({ website: "spam" }));

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails clearly when Resend is not configured", async () => {
    vi.stubEnv("RESEND_CONTACTS_API_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");

    const response = await POST(newsletterRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "NEWSLETTER_NOT_CONFIGURED",
    });
  });

  it("creates a new subscribed contact with the newsletter topic", async () => {
    vi.stubEnv("RESEND_CONTACTS_API_KEY", "re_contacts_test");
    vi.stubEnv("RESEND_API_KEY", "re_send_only_test");
    vi.stubEnv("RESEND_NEWSLETTER_TOPIC_ID", "topic_launch");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "contact-1" }), { status: 200 }),
      );

    const response = await POST(
      newsletterRequest({ email: " MEMBER@EXAMPLE.COM " }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "https://api.resend.com/contacts/member%40example.com",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer re_contacts_test",
        }),
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://api.resend.com/contacts",
      expect.objectContaining({ method: "POST" }),
    );

    const requestOptions = fetchSpy.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(requestOptions.body))).toEqual({
      email: "member@example.com",
      unsubscribed: false,
      topics: [{ id: "topic_launch", subscription: "opt_in" }],
    });
  });

  it("reactivates an existing contact and its newsletter topic", async () => {
    vi.stubEnv("RESEND_CONTACTS_API_KEY", "re_contacts_test");
    vi.stubEnv("RESEND_NEWSLETTER_TOPIC_ID", "topic_launch");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "contact-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "contact-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "topic_launch" }), { status: 200 }),
      );

    const response = await POST(newsletterRequest());

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://api.resend.com/contacts/member%40example.com",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      "https://api.resend.com/contacts/member%40example.com/topics",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("returns a generic error when Resend rejects the subscription", async () => {
    vi.stubEnv("RESEND_CONTACTS_API_KEY", "re_contacts_test");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401, statusText: "Unauthorized" }),
    );

    const response = await POST(newsletterRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Newsletter subscription failed.",
      code: "NEWSLETTER_SUBSCRIPTION_FAILED",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Newsletter subscription failed through Resend.",
      { status: 401, statusText: "Unauthorized" },
    );
  });
});
