import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import ProfileSettingsAccess from "./ProfileSettingsAccess";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} href={href}>
      {children}
    </a>
  ),
}));

const labels = {
  locale: "en",
  openLabel: "Open profile settings",
};

describe("ProfileSettingsAccess", () => {
  it("links directly to profile settings", () => {
    render(<ProfileSettingsAccess {...labels} />);

    expect(
      screen.getByRole("link", { name: "Open profile settings" }),
    ).toHaveAttribute("href", "/en/settings");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
