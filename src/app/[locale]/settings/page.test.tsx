import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SettingsPage from "./page";

describe("SettingsPage", () => {
  it("renders all settings sections with mock defaults", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
    expect(screen.getByTestId("settings-profile-section")).toBeInTheDocument();
    expect(screen.getByTestId("settings-body-section")).toBeInTheDocument();
    expect(screen.getByTestId("settings-workout-section")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nutrition-section")).toBeInTheDocument();
    expect(screen.getByTestId("settings-gamification-section")).toBeInTheDocument();
    expect(screen.getByTestId("settings-notifications-section")).toBeInTheDocument();
    expect(screen.getByTestId("settings-privacy-section")).toBeInTheDocument();
    expect(screen.getByTestId("settings-app-section")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveValue("Sandrin Member");
    expect(screen.getByTestId("settings-badges-placeholder")).toHaveTextContent("Consistency");
  });

  it("updates local draft state and shows success after saving", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.clear(screen.getByLabelText("Full name"));
    await user.type(screen.getByLabelText("Full name"), "Alex Settings");
    await user.click(screen.getByTestId("settings-toggle-waterReminders"));
    await user.click(screen.getByTestId("settings-save-button"));

    expect(screen.getByLabelText("Full name")).toHaveValue("Alex Settings");
    expect(screen.getByTestId("settings-toggle-waterReminders")).not.toBeChecked();
    expect(screen.getByTestId("settings-success-message")).toHaveTextContent("Settings saved successfully.");
  });

  it("resets unsaved changes back to the last saved settings", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.clear(screen.getByLabelText("Username"));
    await user.type(screen.getByLabelText("Username"), "temporary");
    await user.click(screen.getByRole("button", { name: "Cancel / Reset" }));

    expect(screen.getByLabelText("Username")).toHaveValue("sandrin_member");
  });
});
