import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ComingSoon from "./ComingSoon";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      eyebrow: "BeweGesund",
      title: "Website under construction",
      description: "We are building the platform.",
      login: "Member sign in",
      phase: "Build phase",
      "status.concept": "The concept is ready",
      "status.content": "Content is being finalized",
      "status.access": "Public access is coming soon",
    })[key] ?? key,
}));

describe("ComingSoon", () => {
  it("renders translated launch content", () => {
    render(<ComingSoon openAuth={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Website under construction" })).toBeInTheDocument();
    expect(screen.getByText("We are building the platform.")).toBeInTheDocument();
    expect(screen.getByText("Public access is coming soon")).toBeInTheDocument();
  });

  it("opens member authentication", async () => {
    const user = userEvent.setup();
    const openAuth = vi.fn();

    render(<ComingSoon openAuth={openAuth} />);
    await user.click(screen.getByRole("button", { name: "Member sign in" }));

    expect(openAuth).toHaveBeenCalledTimes(1);
  });
});
