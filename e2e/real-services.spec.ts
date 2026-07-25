import { expect, test } from "@playwright/test";

const runRealServiceE2e = process.env.RUN_REAL_SERVICE_E2E === "true";

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`${name} is required for real-service E2E tests.`);
  return value;
}

async function callFunction<T>(
  functionName: string,
  data: unknown,
  options: { idToken: string; appCheckToken: string },
) {
  const functionsBaseUrl = env("REAL_E2E_FUNCTIONS_BASE_URL").replace(
    /\/$/,
    "",
  );
  const response = await fetch(`${functionsBaseUrl}/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.idToken}`,
      "Content-Type": "application/json",
      "X-Firebase-AppCheck": options.appCheckToken,
    },
    body: JSON.stringify({ data }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    result?: T;
    error?: { message?: string };
  };

  expect(response.ok, payload.error?.message ?? `${functionName} failed`).toBe(
    true,
  );
  expect(
    payload.result,
    `${functionName} returned no callable result`,
  ).toBeTruthy();

  return payload.result as T;
}

test.describe("real service smoke tests", () => {
  test.skip(
    !runRealServiceE2e,
    "Set RUN_REAL_SERVICE_E2E=true and REAL_E2E_* env vars to hit real services.",
  );

  test("creates a real Stripe Checkout Session without completing payment", async () => {
    const result = await callFunction<{
      ok?: boolean;
      sessionId?: string;
      url?: string;
    }>(
      "createStripeCheckoutSession",
      {
        locale: process.env.REAL_E2E_LOCALE ?? "de",
        memberPackage: process.env.REAL_E2E_MEMBER_PACKAGE ?? "basic",
      },
      {
        idToken: env("REAL_E2E_FIREBASE_ID_TOKEN"),
        appCheckToken: env("REAL_E2E_APP_CHECK_TOKEN"),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.sessionId).toMatch(/^cs_/);
    expect(result.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  test("gets a signed Mux playback token through the app API", async ({
    request,
    baseURL,
  }) => {
    const response = await request.post(
      `${baseURL ?? ""}/api/mux/playback-token`,
      {
        headers: {
          Authorization: `Bearer ${env("REAL_E2E_FIREBASE_ID_TOKEN")}`,
          "Content-Type": "application/json",
        },
        data: {
          playbackId: env("REAL_E2E_MUX_PLAYBACK_ID"),
          courseSlug: env("REAL_E2E_COURSE_SLUG"),
          contentType: process.env.REAL_E2E_MUX_CONTENT_TYPE ?? "course",
          locale: process.env.REAL_E2E_LOCALE ?? "de",
        },
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      playbackToken?: string;
      code?: string;
      error?: string;
    };

    expect(response.ok(), payload.code ?? payload.error).toBe(true);
    expect(payload.playbackToken).toBeTruthy();
  });

  test("creates a real Google Health OAuth authorization URL", async () => {
    const result = await callFunction<{ url?: string }>(
      "createGoogleHealthAuthorizationUrl",
      { locale: process.env.REAL_E2E_LOCALE ?? "de" },
      {
        idToken: env("REAL_E2E_FIREBASE_ID_TOKEN"),
        appCheckToken: env("REAL_E2E_APP_CHECK_TOKEN"),
      },
    );

    expect(result.url).toMatch(
      /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/,
    );
    expect(result.url).toContain("scope=");
    expect(result.url).toContain("state=");
  });
});
