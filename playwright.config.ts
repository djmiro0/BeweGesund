import { defineConfig, devices } from "@playwright/test";

const useExistingServer = process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "true";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (useExistingServer ? "http://localhost:3000" : "http://127.0.0.1:3100");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: useExistingServer
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: "http://127.0.0.1:3100/de",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
