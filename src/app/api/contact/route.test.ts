import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function contactRequest(overrides: Record<string, unknown> = {}) {
  return new Request("https://bewegesund.de/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify({
      name: "Test Member",
      email: "member@example.com",
      phone: "",
      topic: "consultation",
      message: "I would like to arrange a consultation.",
      locale: "en",
      ...overrides,
    }),
  });
}

describe("contact route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects invalid contact details", async () => {
    const response = await POST(contactRequest({ email: "invalid" }));

    expect(response.status).toBe(400);
  });

  it("fails clearly when email delivery credentials are not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_EMAIL_FROM", "");
    vi.stubEnv("CONTACT_EMAIL_TO", "");

    const response = await POST(contactRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ code: "CONTACT_NOT_CONFIGURED" });
  });

  it("sends a validated request through Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_EMAIL_FROM", "BeweGesund <kontakt@example.com>");
    vi.stubEnv("CONTACT_EMAIL_TO", "info@example.com");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "email-1" }), { status: 200 }),
    );

    const response = await POST(contactRequest());

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer re_test" }),
      }),
    );
  });

  it("uses info@bewegesund.de as the default recipient", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_EMAIL_FROM", "BeweGesund <kontakt@example.com>");
    vi.stubEnv("CONTACT_EMAIL_TO", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "email-1" }), { status: 200 }),
    );

    await POST(contactRequest());

    const requestOptions = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(requestOptions.body))).toMatchObject({
      to: ["info@bewegesund.de"],
    });
  });

  it("logs Resend delivery failures and includes provider details outside production", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_EMAIL_FROM", "BeweGesund <kontakt@example.com>");
    vi.stubEnv("CONTACT_EMAIL_TO", "info@example.com");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Domain is not verified" }), {
        status: 403,
        statusText: "Forbidden",
      }),
    );

    const response = await POST(contactRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: "CONTACT_DELIVERY_FAILED",
      providerStatus: 403,
      providerMessage: expect.stringContaining("Domain is not verified"),
    });
    expect(console.error).toHaveBeenCalledWith(
      "Contact delivery failed through Resend.",
      expect.objectContaining({
        status: 403,
        body: expect.stringContaining("Domain is not verified"),
      }),
    );
  });

  it("does not expose provider failure details in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_EMAIL_FROM", "BeweGesund <kontakt@example.com>");
    vi.stubEnv("CONTACT_EMAIL_TO", "info@example.com");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Domain is not verified" }), { status: 403 }),
    );

    const response = await POST(contactRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Contact delivery failed.",
      code: "CONTACT_DELIVERY_FAILED",
    });
  });
});
