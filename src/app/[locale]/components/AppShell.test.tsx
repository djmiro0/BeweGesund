import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferenceEffects, CheckoutReturnSync, ShellFrame } from "./AppShell";
import { ThemeProvider, useTheme } from "./ThemeProvider";

const mocks = vi.hoisted(() => ({
  callable: vi.fn(),
  httpsCallable: vi.fn(),
  signOut: vi.fn(),
  pathname: "/de",
  auth: {
    user: null as null | {
      uid: string;
      displayName: string;
      photoURL: null;
      providerData: Array<{ providerId: string }>;
    },
    profile: null as null | {
      email?: string;
      firstName?: string;
      lastName?: string;
      age?: number | null;
      gender?: string;
      heightCm?: number | null;
      weightKg?: number | null;
      regionKey?: string;
      photoURL?: string | null;
      subscriptionStatus?: string;
    },
    appPreferences: {
      theme: "system",
    },
    loading: false,
    isAuthOpen: false,
    openAuth: vi.fn(),
    closeAuth: vi.fn(),
  },
}));

vi.mock("../../../../firebase.config", () => ({
  auth: {},
  functions: {},
}));

vi.mock("firebase/auth", () => ({
  signOut: mocks.signOut,
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: mocks.httpsCallable,
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

vi.mock("./PaymentRequired", () => ({
  default: () => <div data-testid="payment-required" />,
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
    mocks.auth.profile = null;
    mocks.auth.appPreferences = { theme: "system" };
    mocks.auth.loading = false;
    mocks.callable.mockReset();
    mocks.callable.mockResolvedValue({ data: { ok: true } });
    mocks.httpsCallable.mockReset();
    mocks.httpsCallable.mockReturnValue(mocks.callable);
    mocks.signOut.mockReset();
    mocks.signOut.mockResolvedValue(undefined);
    vi.unstubAllEnvs();
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

  it("confirms successful Stripe checkout returns", async () => {
    window.history.replaceState(null, "", "/de?checkout=success&session_id=cs_test_123");
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };

    render(<CheckoutReturnSync />);

    await waitFor(() => expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "confirmStripeCheckoutSession"));
    expect(mocks.callable).toHaveBeenCalledWith({ sessionId: "cs_test_123" });
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("deletes the incomplete account after canceled Stripe checkout returns", async () => {
    window.history.replaceState(null, "", "/de?checkout=canceled");
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };

    render(<CheckoutReturnSync />);

    await waitFor(() => expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "deleteUserAccount"));
    expect(mocks.callable).toHaveBeenCalledWith({});
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({}));
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("renders public routes when the coming soon flag is disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_COMING_SOON_ENABLED", "false");
    mocks.pathname = "/de/about";

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

  it("blocks the application for authenticated users without paid access", () => {
    mocks.pathname = "/de/courses";
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };
    mocks.auth.profile = {
      email: "member@example.com",
      firstName: "Paid",
      lastName: "Pending",
      age: 42,
      gender: "female",
      heightCm: 170,
      weightKg: 70,
      regionKey: "berlin",
      photoURL: null,
      subscriptionStatus: "free",
    };

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("payment-required")).toBeInTheDocument();
    expect(screen.queryByTestId("page-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-tabs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("progress-photo-reminder")).not.toBeInTheDocument();
  });

  it("keeps the home page visible for authenticated users without paid access", () => {
    mocks.pathname = "/de";
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };
    mocks.auth.profile = {
      email: "member@example.com",
      firstName: "Paid",
      lastName: "Pending",
      age: 42,
      gender: "female",
      heightCm: 170,
      weightKg: 70,
      regionKey: "berlin",
      photoURL: null,
      subscriptionStatus: "free",
    };

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("payment-required")).not.toBeInTheDocument();
  });

  it("keeps the profile page visible for authenticated users without paid access", () => {
    mocks.pathname = "/de/profile";
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };
    mocks.auth.profile = {
      email: "member@example.com",
      firstName: "Paid",
      lastName: "Pending",
      age: 42,
      gender: "female",
      heightCm: 170,
      weightKg: 70,
      regionKey: "berlin",
      photoURL: null,
      subscriptionStatus: "free",
    };

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("payment-required")).not.toBeInTheDocument();
  });

  it("keeps settings visible for authenticated users without paid access", () => {
    mocks.pathname = "/de/settings";
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };
    mocks.auth.profile = {
      email: "member@example.com",
      firstName: "Paid",
      lastName: "Pending",
      age: 42,
      gender: "female",
      heightCm: 170,
      weightKg: 70,
      regionKey: "berlin",
      photoURL: null,
      subscriptionStatus: "free",
    };

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("payment-required")).not.toBeInTheDocument();
  });

  it("renders the application for authenticated users with active paid access", () => {
    mocks.pathname = "/de/courses";
    mocks.auth.user = {
      uid: "user-1",
      displayName: "Member",
      photoURL: null,
      providerData: [],
    };
    mocks.auth.profile = {
      email: "member@example.com",
      firstName: "Paid",
      lastName: "Member",
      age: 42,
      gender: "female",
      heightCm: 170,
      weightKg: 70,
      regionKey: "berlin",
      photoURL: null,
      subscriptionStatus: "active",
    };

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("payment-required")).not.toBeInTheDocument();
  });

  it("keeps app-only prompts hidden while a Google user completes registration", () => {
    mocks.pathname = "/de/courses";
    mocks.auth.user = {
      uid: "google-user",
      displayName: "Google Member",
      photoURL: null,
      providerData: [{ providerId: "google.com" }],
    };
    mocks.auth.profile = {
      email: "member@example.com",
      firstName: "Google",
      lastName: "",
      age: null,
      gender: "",
      heightCm: null,
      weightKg: null,
      regionKey: "",
      photoURL: null,
    };

    render(
      <ShellFrame locale="de">
        <div data-testid="page-content" />
      </ShellFrame>,
    );

    expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
    expect(screen.queryByTestId("progress-photo-reminder")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-tabs")).not.toBeInTheDocument();
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
