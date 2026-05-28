import { expect, test } from "@playwright/test";

test.describe("public homepage", () => {
  test("loads the redesigned hero and opens the sign-in modal", async ({ page }) => {
    await page.goto("/de");

    // Smoke-check the first meaningful screen from the visual refresh.
    await expect(page.getByRole("heading", { name: /bewege dich/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /jetzt starten/i })).toBeVisible();

    await page.getByRole("button", { name: /jetzt starten/i }).click();

    // The CTA should keep the original behavior: opening the member login.
    await expect(page.getByRole("heading", { name: /mitglieder-login/i })).toBeVisible();
    await expect(page.getByLabel(/e-mail-adresse/i)).toBeVisible();
  });

  test("carousel next control changes the visible story", async ({ page }) => {
    await page.goto("/de");

    await expect(page.getByRole("heading", { name: /bewege dich mit vertrauen/i })).toBeVisible();
    await page.getByRole("button", { name: /next banner/i }).click();

    // The carousel animation should land on the second banner copy.
    await expect(page.getByRole("heading", { name: /live-begleitung und unterstützung/i })).toBeVisible();
  });
});
