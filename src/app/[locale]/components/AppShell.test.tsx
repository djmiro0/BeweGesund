import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellFrame } from "./AppShell";

const mocks = vi.hoisted(() => ({
  pathname: "/de",
  auth: {
    user: null as null | {
      displayName: string;
      photoURL: null;
      providerData: Array<{ providerId: string }>;
    },
    profile: null,
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

vi.mock("@/app/components/Footer/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

describe("ShellFrame launch routing", () => {
  beforeEach(() => {
    mocks.pathname = "/de";
    mocks.auth.user = null;
    mocks.auth.loading = false;
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
});
