import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";
import styles from "./Header.module.css";

const { push, toggleTheme } = vi.hoisted(() => ({
  push: vi.fn(),
  toggleTheme: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    ({
      logo: "Bewegesund",
      signIn: "Sign in",
      signOut: "Sign out",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      language: "Language",
      profileFallback: "Member",
      profileLink: "Profile",
      profileAvatarAlt: `Avatar ${values?.name ?? ""}`,
      lightMode: "Light",
      darkMode: "Dark",
      themeLight: "Switch to light mode",
      themeDark: "Switch to dark mode",
      "nav.program": "Program",
      "nav.courses": "Courses",
      "nav.settings": "Settings",
      "nav.calendar": "Calendar",
      "nav.blogs": "Blogs",
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

  it("uses the site logo as the header brand", () => {
    render(<Header locale="en" />);

    expect(screen.getByTestId("header-brand-logo")).toHaveAttribute("src", "/logo.png");
    expect(screen.getByTestId("header-brand-logo")).toHaveClass(styles.brandLogo);
  });

  it("hides locked navigation while the public launch screen is active", () => {
    render(<Header locale="en" launchMode />);

    expect(screen.queryByRole("link", { name: "Program" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Blogs" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-menu-trigger")).not.toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("uses a language dropdown and keeps the current path when changing locale", async () => {
    const user = userEvent.setup();
    render(<Header locale="en" />);

    await user.selectOptions(screen.getByLabelText("Language"), "de");

    expect(push).toHaveBeenCalledWith("/de");
  });

  it("uses a compact icon control for light and dark mode", async () => {
    const user = userEvent.setup();
    render(<Header locale="en" />);

    const themeButton = screen.getByTestId("theme-toggle");

    expect(themeButton).toHaveAccessibleName("Switch to dark mode");

    await user.click(themeButton);

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("closes the mobile menu from the blurred page backdrop", async () => {
    const user = userEvent.setup();
    render(<Header locale="en" />);

    const trigger = screen.getByTestId("mobile-menu-trigger");
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("mobile-menu")).toHaveClass(styles.mobileMenuOpen);
    expect(screen.getByTestId("mobile-menu-backdrop")).toHaveClass(styles.mobileBackdrop);

    await user.click(screen.getByTestId("mobile-menu-backdrop"));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-menu-backdrop")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-menu")).not.toHaveClass(styles.mobileMenuOpen);
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
