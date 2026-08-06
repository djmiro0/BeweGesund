import { expect, test, type Page, type Route } from "@playwright/test";

const firebaseUser = {
  uid: "e2e-user-uid",
  email: "e2e.member@example.com",
  password: "Secret123!",
  idToken: "e2e-id-token",
  refreshToken: "e2e-refresh-token",
};

const appBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "true"
    ? "http://localhost:3000"
    : "http://127.0.0.1:3100");

type EventName =
  | "auth:signUp"
  | "auth:updateProfile"
  | "firestore:profileWrite"
  | "functions:createStripeCheckoutSession"
  | "stripe:checkout"
  | "stripe:return"
  | "functions:confirmStripeCheckoutSession"
  | "auth:signIn";

async function json(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function readPostJson(route: Route) {
  const postData = route.request().postData();

  if (!postData) return {};

  try {
    return JSON.parse(postData);
  } catch {
    return {};
  }
}

async function installAuthOnboardingMocks(page: Page, events: EventName[]) {
  await page.exposeFunction(
    "__recordBewegesundE2eEvent",
    (event: EventName) => {
      events.push(event);
    },
  );
  await page.addInitScript(() => {
    const e2eWindow = window as typeof window & {
      __recordBewegesundE2eEvent?: (event: EventName) => Promise<void>;
      __BEWEGESUND_E2E_AUTH_MOCK__?: {
        saveProfile?: (path: string, payload: unknown) => Promise<void>;
      };
    };

    e2eWindow.__BEWEGESUND_E2E_AUTH_MOCK__ = {
      saveProfile: async (path, payload) => {
        if (path !== "users/e2e-user-uid") {
          throw new Error(`Unexpected profile path: ${path}`);
        }

        const profile = payload as {
          email?: string;
          anamnesis?: { goals?: string[] };
          anamnesisStatusKey?: string;
        };

        if (profile.email !== "e2e.member@example.com") {
          throw new Error(
            `Unexpected profile email: ${profile.email ?? "missing"}`,
          );
        }

        if (!profile.anamnesis?.goals?.includes("muscle-fitness")) {
          throw new Error(
            "Anamnesis payload did not include the selected goal.",
          );
        }

        if (profile.anamnesisStatusKey !== "completed") {
          throw new Error(
            `Unexpected anamnesis status: ${profile.anamnesisStatusKey ?? "missing"}`,
          );
        }

        await e2eWindow.__recordBewegesundE2eEvent?.("firestore:profileWrite");
      },
    };
  });

  await page.route(
    "https://identitytoolkit.googleapis.com/v1/accounts:signUp?*",
    async (route) => {
      events.push("auth:signUp");
      const requestBody = await readPostJson(route);
      expect(requestBody.email).toBe(firebaseUser.email);
      expect(requestBody.password).toBe(firebaseUser.password);

      await json(route, {
        kind: "identitytoolkit#SignupNewUserResponse",
        localId: firebaseUser.uid,
        email: firebaseUser.email,
        idToken: firebaseUser.idToken,
        refreshToken: firebaseUser.refreshToken,
        expiresIn: "3600",
      });
    },
  );

  await page.route(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?*",
    async (route) => {
      events.push("auth:signIn");
      const requestBody = await readPostJson(route);
      expect(requestBody.email).toBe(firebaseUser.email);
      expect(requestBody.password).toBe(firebaseUser.password);

      await json(route, {
        kind: "identitytoolkit#VerifyPasswordResponse",
        localId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: "E2E Member",
        idToken: firebaseUser.idToken,
        registered: true,
        refreshToken: firebaseUser.refreshToken,
        expiresIn: "3600",
      });
    },
  );

  await page.route(
    "https://identitytoolkit.googleapis.com/v1/accounts:update?*",
    async (route) => {
      events.push("auth:updateProfile");
      await json(route, {
        localId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: "E2E Member",
        idToken: firebaseUser.idToken,
        refreshToken: firebaseUser.refreshToken,
        expiresIn: "3600",
      });
    },
  );

  await page.route(
    "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?*",
    async (route) => {
      events.push("auth:sendVerification");
      const requestBody = await readPostJson(route);
      expect(requestBody.requestType).toBe("VERIFY_EMAIL");
      await json(route, { email: firebaseUser.email });
    },
  );

  await page.route(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?*",
    async (route) => {
      await json(route, {
        kind: "identitytoolkit#GetAccountInfoResponse",
        users: [
          {
            localId: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: "E2E Member",
            emailVerified: true,
            providerUserInfo: [
              {
                providerId: "password",
                email: firebaseUser.email,
                rawId: firebaseUser.email,
              },
            ],
            createdAt: "1700000000000",
            lastLoginAt: "1700000000000",
          },
        ],
      });
    },
  );

  await page.route(
    "https://securetoken.googleapis.com/v1/token?*",
    async (route) => {
      await json(route, {
        access_token: firebaseUser.idToken,
        expires_in: "3600",
        token_type: "Bearer",
        refresh_token: firebaseUser.refreshToken,
        id_token: firebaseUser.idToken,
        user_id: firebaseUser.uid,
        project_id: "sandrin-app",
      });
    },
  );

  await page.route("https://firestore.googleapis.com/**", async (route) => {
    await json(route, {
      writeResults: [{ updateTime: "2026-06-26T08:00:00.000000Z" }],
      commitTime: "2026-06-26T08:00:00.000000Z",
      documents: [],
    });
  });

  await page.route("**/createStripeCheckoutSession**", async (route) => {
    events.push("functions:createStripeCheckoutSession");
    const requestBody = await readPostJson(route);
    expect(requestBody.data).toMatchObject({
      locale: "de",
      memberPackage: "basic",
    });

    await json(route, {
      result: {
        ok: true,
        sessionId: "cs_test_bewegesund_e2e",
        url: "https://checkout.stripe.test/session/cs_test_bewegesund_e2e",
      },
    });
  });

  await page.route("**/confirmStripeCheckoutSession**", async (route) => {
    events.push("functions:confirmStripeCheckoutSession");
    const requestBody = await readPostJson(route);
    expect(requestBody.data).toMatchObject({
      sessionId: "cs_test_bewegesund_e2e",
    });
    await json(route, { result: { ok: true } });
  });

  await page.route(
    "https://checkout.stripe.test/session/cs_test_bewegesund_e2e",
    async (route) => {
      events.push("stripe:checkout");
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `
        <!doctype html>
        <html>
          <body>
            <h1>Stripe test checkout</h1>
            <a href="${appBaseURL}/de?checkout=success&session_id=cs_test_bewegesund_e2e">Complete payment</a>
          </body>
        </html>
      `,
      });
    },
  );
}

async function dismissCookieBanner(page: Page) {
  const acceptButton = page.getByRole("button", {
    name: /akzeptieren|accept/i,
  });

  await acceptButton.waitFor({ state: "visible", timeout: 5_000 });
  await acceptButton.click();
  await expect(acceptButton).toBeHidden();
}

async function completeAccountStep(page: Page) {
  await dismissCookieBanner(page);
  await page.getByRole("button", { name: /mitglieder-login/i }).click();
  await page.getByRole("button", { name: /konto erstellen/i }).click();

  await page.getByPlaceholder("Vorname").fill("E2E");
  await page.getByPlaceholder("Nachname").fill("Member");
  await page.getByPlaceholder("E-Mail-Adresse").fill(firebaseUser.email);
  await page
    .getByPlaceholder("Passwort", { exact: true })
    .fill(firebaseUser.password);
  await page
    .getByPlaceholder("Passwort bestätigen", { exact: true })
    .fill(firebaseUser.password);

  const numberFields = page.getByRole("spinbutton");
  await numberFields.nth(0).fill("170");
  await numberFields.nth(1).fill("70");

  await page
    .getByRole("combobox", { name: /geschlecht/i })
    .selectOption("female");
  await page
    .getByRole("combobox", { name: /bundesland/i })
    .selectOption("berlin");

  await page.getByLabel(/nutzungsbedingungen/i).check();
  await page.getByLabel(/verarbeitung/i).check();
  await page.getByRole("button", { name: /weiter zur anamnese/i }).click();
}

async function completeAnamnesisStep(page: Page) {
  await expect(page.getByRole("heading", { name: /anamnese/i })).toBeVisible();

  await page.getByRole("spinbutton").fill("35");
  await page.getByLabel(/Muskelaufbau & Allgemeine Fitness/i).check();
  await page.getByLabel(/Nein, ich bin schmerzfrei/i).check();
  await page.getByLabel("Anfänger").check();
  await page.getByLabel(/Keine Einschränkungen/i).check();
  await page.getByLabel("Moderat").check();
  await page.getByRole("radio", { name: "Nein", exact: true }).check();
  await page.getByLabel(/Keine dieser schweren Einschränkungen/i).check();
  await page.getByLabel(/wahrheitsgemäß beantwortet/i).check();
}

test.describe("account onboarding and payment", () => {
  test("creates an account, completes anamnesis, opens checkout, returns home, and signs in", async ({
    browser,
    page,
  }) => {
    test.setTimeout(45_000);
    const events: EventName[] = [];
    await installAuthOnboardingMocks(page, events);

    await page.goto("/de");
    await completeAccountStep(page);
    await completeAnamnesisStep(page);

    await page.getByRole("button", { name: /anamnese abschließen/i }).click();
    await expect
      .poll(() => events)
      .toContain("functions:createStripeCheckoutSession");
    await expect(
      page.getByRole("heading", { name: /stripe test checkout/i }),
    ).toBeVisible();

    await page.getByRole("link", { name: /complete payment/i }).click();
    events.push("stripe:return");
    await expect
      .poll(() => events)
      .toContain("functions:confirmStripeCheckoutSession");
    await expect(page).toHaveURL(/\/de$/);
    await expect(
      page.getByRole("link", { name: /profil öffnen/i }).first(),
    ).toBeVisible();

    const returningContext = await browser.newContext({ baseURL: appBaseURL });
    const returningPage = await returningContext.newPage();
    await installAuthOnboardingMocks(returningPage, events);

    await returningPage.goto("/de");
    await dismissCookieBanner(returningPage);
    await returningPage
      .getByRole("button", { name: /mitglieder-login/i })
      .click();
    await returningPage.getByLabel(/e-mail-adresse/i).fill(firebaseUser.email);
    await returningPage.getByLabel(/^passwort$/i).fill(firebaseUser.password);
    await returningPage
      .locator("form")
      .getByRole("button", { name: /^anmelden$/i })
      .click();

    await expect
      .poll(() => events)
      .toEqual([
        "auth:signUp",
        "auth:updateProfile",
        "firestore:profileWrite",
        "functions:createStripeCheckoutSession",
        "stripe:checkout",
        "stripe:return",
        "functions:confirmStripeCheckoutSession",
        "auth:signIn",
      ]);

    await returningContext.close();
  });
});
