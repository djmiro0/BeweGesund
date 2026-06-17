import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferenceEffects, ShellFrame } from "./AppShell";
import { ThemeProvider, useTheme } from "./ThemeProvider";

const mocks = vi.hoisted(() => ({
  pathname: "/de",
  auth: {
    user: null as null | {
      uid: string;
      displayName: string;
      photoURL: null;
      providerData: Array<{ providerId: string }>;
    },
    profile: null,
    appPreferences: {
      theme: "system",
    },
    loading: false,
    isAuthOpen: false,
    openAuth: vi.fn(),
    closeAuth: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "loading" ? "Loading" : key),
}));

vi.mock("./AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mocks.auth,
}));

vi.mock("@/app/components/Header/Header", () => ({
  default: ({ launchMode }: { launchMode?: boolean }) => (
    <div data-testid="header" data-launch-mode={launchMode ? "true" : "false"} />
  ),
}));

vi.mock("./ComingSoon", () => ({
  default: () => <div data-testid="coming-soon" />,
}));

vi.mock("./AuthModal", () => ({
  default: () => <div data-testid="auth-modal" />,
}));

vi.mock("./MobileTabBar", () => ({
  default: () => <div data-testid="mobile-tabs" />,
}));

vi.mock("./ProgressPhotoReminder", () => ({
  default: () => <div data-testid="progress-photo-reminder" />,
}));

vi.mock("./PwaInstallPrompt", () => ({
  default: () => <div data-testid="pwa-install-prompt" />,
}));

vi.mock("@/app/components/Footer/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

describe("ShellFrame launch routing", () => {
  beforeEach(() => {
  mocks.pathname = "/de";
  mocks.auth.user = null;
  mocks.auth.appPreferences = { theme: "system" };
  mocks.auth.loading = false;
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

  it.each(["/de", "/de/blogs", "/de/courses", "/de/about"])(
    "keeps unauthenticated route %s behind the launch screen",
    (pathname) => {
      mocks.pathname = pathname;

      render(
        <ShellFrame locale="de">
          <div data-testid="page-content" />
        </ShellFrame>,
      );

      expect(screen.getByTestId("coming-soon")).toBeInTheDocument();
      expect(screen.getByTestId("header")).toHaveAttribute("data-launch-mode", "true");
      expect(screen.queryByTestId("page-content")).not.toBeInTheDocument();
    },
  );

  it("keeps authentication action links reachable", () => {
    mocks.pathname = "/de/auth/action";

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("coming-soon")).not.toBeInTheDocument();
    expect(screen.getByTestId("header")).toHaveAttribute("data-launch-mode", "false");
  });

  it("renders the application for authenticated users", () => {
    mocks.pathname = "/de/courses";
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("coming-soon")).not.toBeInTheDocument();
  });

  it("does not reset a header theme toggle back to the stored remote preference", async () => {
    function ThemeProbe() {
      const { theme, toggleTheme } = useTheme();

      return (
        <button type="button" data-testid="theme-probe" onClick={toggleTheme}>
          {theme}
        </button>
      );
    }

    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };
    mocks.auth.appPreferences = { theme: "system" };

    render(
      <ThemeProvider>
        <AppPreferenceEffects />
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("theme-probe")).toHaveTextContent("light"));

    fireEvent.click(screen.getByTestId("theme-probe"));

    await waitFor(() => expect(screen.getByTestId("theme-probe")).toHaveTextContent("dark"));
    expect(window.localStorage.getItem("sbewegesund-theme")).toBe("dark");
  });
});
