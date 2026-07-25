import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HeroSection from "./HeroSection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      title: "MOVE TOWARD A HEALTHIER BODY",
      subtitle: "Online movement and rehabilitation support.",
      cta: "Get Started",
    })[key] ?? key,
}));

describe("HeroSection", () => {
  it("renders the refreshed hero content and image", () => {
    render(<HeroSection />);

    // The hero should keep the existing translated content visible.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "MOVE TOWARD A HEALTHIER BODY",
    );
    expect(
      screen.getByText("Online movement and rehabilitation support."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeInTheDocument();

    // The new design depends on the training photo as its visual anchor.
    expect(
      document.querySelector('img[src="/training.jpg"]'),
    ).toBeInTheDocument();
  });

  it("opens authentication from the primary CTA", async () => {
    const user = userEvent.setup();
    const openAuth = vi.fn();

    render(<HeroSection openAuth={openAuth} />);
    await user.click(screen.getByRole("button", { name: /get started/i }));

    expect(openAuth).toHaveBeenCalledTimes(1);
  });
});
