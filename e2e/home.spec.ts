import { expect, test } from "@playwright/test";

test.describe("pre-launch website", () => {
  test("keeps the public homepage behind the launch screen", async ({
    page,
  }) => {
    await page.goto("/de");

    await expect(
      page.getByRole("heading", { name: /website in vorbereitung/i }),
    ).toBeVisible();
    await expect(page.getByText(/öffentliche zugang folgt/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /programme/i })).toHaveCount(0);
  });

  test("keeps direct public routes behind the same launch screen", async ({
    page,
  }) => {
    await page.goto("/de/blogs");

    await expect(
      page.getByRole("heading", { name: /website in vorbereitung/i }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/de\/blogs$/);
  });

  test("supports theme switching and member sign-in", async ({ page }) => {
    await page.goto("/de");

    const themeToggle = page.getByTestId("theme-toggle");
    const initialTheme = await page.locator("html").getAttribute("data-theme");
    await themeToggle.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      initialTheme === "dark" ? "light" : "dark",
    );

    await page.getByRole("button", { name: /mitglieder-login/i }).click();

    await expect(
      page.getByRole("heading", { name: /mitglieder-login/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/e-mail-adresse/i)).toBeVisible();
  });
});
