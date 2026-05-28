import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import ProfileSettingsAccess from "./ProfileSettingsAccess";

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

const labels = {
  locale: "en",
  openLabel: "Open profile settings",
  closeLabel: "Close profile settings",
  title: "Profile settings",
  description: "Open the full settings area.",
  settingsLabel: "Open settings",
};

describe("ProfileSettingsAccess", () => {
  it("opens the profile settings panel with a settings link", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsAccess {...labels} />);

    await user.click(screen.getByTestId("profile-settings-trigger"));

    expect(screen.getByTestId("profile-settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("profile-settings-backdrop")).toBeInTheDocument();
    expect(screen.getByTestId("profile-settings-panel")).toHaveTextContent("Profile settings");
    expect(screen.getByTestId("profile-settings-link")).toHaveAttribute("href", "/en/settings");
  });

  it("closes the settings panel from the blurred backdrop", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsAccess {...labels} />);

    await user.click(screen.getByTestId("profile-settings-trigger"));
    await user.click(screen.getByTestId("profile-settings-backdrop"));

    expect(screen.queryByTestId("profile-settings-overlay")).not.toBeInTheDocument();
  });
});
