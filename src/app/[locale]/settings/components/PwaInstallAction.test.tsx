import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PWA_INSTALL_REQUEST_EVENT } from "@/lib/pwaInstall";
import PwaInstallAction from "./PwaInstallAction";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => ({
    "installApp.title": "Install Bewegesund",
    "installApp.description": "Add the app to your home screen.",
    "installApp.action": "Install app",
  })[key] ?? key,
}));

function setDevice(userAgent: string, standalone: boolean) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: userAgent });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: standalone })));
}

describe("PwaInstallAction", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows in mobile app settings and requests the install dialog", async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    setDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", false);
    window.addEventListener(PWA_INSTALL_REQUEST_EVENT, listener);

    render(<PwaInstallAction />);

    await user.click(await screen.findByRole("button", { name: "Install app" }));
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(PWA_INSTALL_REQUEST_EVENT, listener);
  });

  it("is hidden on desktop", async () => {
    setDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", false);
    render(<PwaInstallAction />);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(screen.queryByTestId("settings-install-app")).not.toBeInTheDocument();
  });

  it("disappears after the app is installed", async () => {
    setDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", false);
    render(<PwaInstallAction />);
    expect(await screen.findByTestId("settings-install-app")).toBeInTheDocument();

    fireEvent(window, new Event("appinstalled"));
    expect(screen.queryByTestId("settings-install-app")).not.toBeInTheDocument();
  });
});
