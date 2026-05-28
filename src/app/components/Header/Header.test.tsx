import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

const { push, toggleTheme } = vi.hoisted(() => ({
  push: vi.fn(),
  toggleTheme: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    ({
      logo: "S.BeweGesund",
      signIn: "Sign in",
      signOut: "Sign out",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      profileFallback: "Member",
      profileLink: "Profile",
      profileAvatarAlt: `Avatar ${values?.name ?? ""}`,
      lightMode: "Light",
      darkMode: "Dark",
      themeLight: "Switch to light mode",
      themeDark: "Switch to dark mode",
      "nav.program": "Program",
      "nav.courses": "Courses",
      "nav.calendar": "Calendar",
      "nav.consultation": "Consultation",
      "nav.contact": "Contact",
      "nav.about": "About",
    })[key] ?? key,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ push }),
}));

vi.mock("@/app/[locale]/components/ThemeProvider", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme,
  }),
}));

vi.mock("../../../../firebase.config", () => ({
  auth: {},
}));

vi.mock("firebase/auth", () => ({
  signOut: vi.fn(),
}));

describe("Header", () => {
  beforeEach(() => {
    push.mockClear();
    toggleTheme.mockClear();
  });

  it("uses the favicon as the mobile brand and keeps the wordmark for wider screens", () => {
    render(<Header locale="en" />);

    expect(screen.getByTestId("header-mobile-logo")).toHaveAttribute("src", "/favicon.ico");
    expect(screen.getByTestId("header-mobile-logo")).toHaveClass("sm:hidden");
    expect(screen.getByTestId("header-desktop-wordmark")).toHaveTextContent("S.BeweGesund");
    expect(screen.getByTestId("header-desktop-wordmark")).toHaveClass("hidden", "sm:block");
  });

  it("closes the mobile menu from the blurred page backdrop", async () => {
    const user = userEvent.setup();
    render(<Header locale="en" />);

    const trigger = screen.getByTestId("mobile-menu-trigger");
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("mobile-menu")).toHaveClass("translate-y-0", "opacity-100");
    expect(screen.getByTestId("mobile-menu-backdrop")).toHaveClass("backdrop-blur-sm");

    await user.click(screen.getByTestId("mobile-menu-backdrop"));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-menu-backdrop")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-menu")).toHaveClass("pointer-events-none", "opacity-0");
  });

  it("closes the mobile menu after selecting a menu link", async () => {
    const user = userEvent.setup();
    render(<Header locale="en" />);

    const trigger = screen.getByTestId("mobile-menu-trigger");
    await user.click(trigger);
    await user.click(screen.getAllByRole("link", { name: "Calendar" })[1]);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-menu-backdrop")).not.toBeInTheDocument();
  });
});
