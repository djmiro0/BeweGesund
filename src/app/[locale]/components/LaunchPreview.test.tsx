import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LaunchPreview from "./LaunchPreview";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string) =>
      ({
        status: "Platform preview · Coming soon",
        "hero.title":
          "Your place for movement, knowledge, and better routines.",
        "hero.description": "Guided health support.",
        "hero.explore": "Explore the preview",
        "hero.login": "Member sign in",
        "offer.eyebrow": "What awaits you",
        "offer.title": "Everything sustainable change needs.",
        "offer.locked": "Coming soon",
        "experience.eyebrow": "One system",
        "experience.title": "Your health as a whole.",
        "experience.description": "Movement, nutrition, and recovery.",
        "experience.status": "The first programs are being prepared",
        "experience.imageAlt": "Balanced meals",
        "faq.eyebrow": "FAQ",
        "faq.title": "In short.",
        "final.eyebrow": "We are nearly ready",
        "final.title": "Soon, we move more.",
        "final.description": "The platform remains protected.",
        "final.login": "Member sign in",
      })[key] ?? key;

    translate.raw = (key: string) => {
      if (key === "offer.pillars") {
        return [
          {
            title: "Training",
            description: "Structured movement.",
            imageAlt: "Guided training",
          },
          {
            title: "Nutrition",
            description: "Practical knowledge.",
            imageAlt: "Balanced meal",
          },
        ];
      }

      if (key === "faq.items") {
        return [
          {
            question: "Will there be a subscription?",
            answer: "Yes, with Basic and Plus plans.",
          },
        ];
      }

      return [];
    };

    return translate;
  },
}));

describe("LaunchPreview", () => {
  it("uses the launch film as an autoplaying, silent loop", () => {
    const { container } = render(<LaunchPreview openAuth={vi.fn()} />);
    const video = container.querySelector("video");

    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("poster", "/launch/hero-training-poster.jpg");
    expect(video).toHaveProperty("muted", true);
    expect(video?.querySelector("source")).toHaveAttribute(
      "src",
      "/launch/hero-training.mp4",
    );
  });

  it("shows the product preview and locked launch state", () => {
    render(<LaunchPreview openAuth={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Your place for movement, knowledge, and better routines.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Platform preview · Coming soon"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Coming soon")).toHaveLength(2);
    expect(screen.getByAltText("Guided training")).toBeInTheDocument();
    expect(screen.getByAltText("Balanced meal")).toBeInTheDocument();
    expect(
      screen.getByText("Will there be a subscription?"),
    ).toBeInTheDocument();
  });

  it("keeps member authentication available", async () => {
    const user = userEvent.setup();
    const openAuth = vi.fn();

    render(<LaunchPreview openAuth={openAuth} />);
    await user.click(
      screen.getAllByRole("button", { name: "Member sign in" })[0],
    );

    expect(openAuth).toHaveBeenCalledTimes(1);
  });
});
