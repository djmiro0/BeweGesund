import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BannerSection from "./BannerSection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      "training.title": "Move With Confidence",
      "training.subtitle": "Build stability and mobility",
      "weights.title": "Live Guidance and Support",
      "weights.subtitle": "Train and learn with expert-led sessions",
      "food.title": "Knowledge That Fits Real Life",
      "food.subtitle": "Nutrition and health education you can use",
    })[key] ?? key,
}));

describe("BannerSection", () => {
  it("renders the first carousel slide with branded controls", () => {
    render(<BannerSection />);

    // The carousel should start on the training story and expose arrow buttons.
    expect(
      screen.getByRole("heading", { name: "Move With Confidence" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Build stability and mobility"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /previous banner/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next banner/i }),
    ).toBeInTheDocument();
  });

  it("moves to the next slide when the next arrow is clicked", async () => {
    const user = userEvent.setup();
    render(<BannerSection />);

    await user.click(screen.getByRole("button", { name: /next banner/i }));

    // The visual transition is animated, so wait for the next slide text.
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Live Guidance and Support" }),
      ).toBeInTheDocument();
    });
  });
});
