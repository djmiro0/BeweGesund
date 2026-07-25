import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { PWA_INSTALL_REQUEST_EVENT } from "@/lib/pwaInstall";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      title: "Install the app",
      iosDescription: "Install the app in two steps",
      iosStepShare: "Tap Share",
      iosStepAdd: "Add to Home Screen",
      install: "Install app",
      understood: "Got it",
      later: "Later",
      close: "Close installation prompt",
    })[key] ?? key,
}));

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value,
  });
}

function setStandalone(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches })),
  );
}

describe("PwaInstallPrompt", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows immediate installation instructions on iOS", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    setStandalone(false);

    render(<PwaInstallPrompt />);

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Install the app in two steps",
    );
    expect(screen.getByText("Add to Home Screen")).toBeInTheDocument();
  });

  it("can be reopened later from the settings install action", async () => {
    const user = userEvent.setup();
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    setStandalone(false);
    render(<PwaInstallPrompt />);

    await user.click(await screen.findByRole("button", { name: "Later" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent(window, new Event(PWA_INSTALL_REQUEST_EVENT));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows the large prompt only on the first mobile visit", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    setStandalone(false);
    localStorage.setItem("pwa-install-prompt-seen", "true");

    render(<PwaInstallPrompt />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent(window, new Event(PWA_INSTALL_REQUEST_EVENT));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens the native install prompt on supported browsers", async () => {
    const user = userEvent.setup();
    const prompt = vi.fn().mockResolvedValue(undefined);
    setUserAgent("Mozilla/5.0 (Linux; Android 15)");
    setStandalone(false);
    render(<PwaInstallPrompt />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });
    fireEvent(window, event);

    await user.click(
      await screen.findByRole("button", { name: "Install app" }),
    );

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show when already installed", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    setStandalone(true);

    render(<PwaInstallPrompt />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show an install option on desktop", () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    setStandalone(false);

    render(<PwaInstallPrompt />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
