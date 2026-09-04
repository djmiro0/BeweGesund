import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MobileTabBar from "./MobileTabBar";

const navigation = vi.hoisted(() => ({ pathname: "/en" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      ariaLabel: "Primary navigation",
      "tabs.home": "Home",
      "tabs.courses": "Courses",
      "tabs.calendar": "Calendar",
      "tabs.relaxation": "Relaxation",
      "tabs.blogs": "Blogs",
    })[key] ?? key,
}));

describe("MobileTabBar", () => {
  beforeEach(() => {
    navigation.pathname = "/en";
  });

  it("keeps Courses selected on nested course pages", () => {
    navigation.pathname = "/en/courses/reha-knee/session-1";

    render(<MobileTabBar locale="en" />);

    expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps Relaxation selected on nested relaxation pages", () => {
    navigation.pathname = "/en/meditation-relaxation/body-scan/session-1";

    render(<MobileTabBar locale="en" />);

    expect(screen.getByRole("link", { name: "Relaxation" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
