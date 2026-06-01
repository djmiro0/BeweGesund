import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import Footer from "./Footer";

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

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    ({
      brand: "Bewegesund",
      tagline: "Movement, rehabilitation, and education with a clearer path toward healthier everyday life.",
      navigationTitle: "Navigation",
      legalTitle: "Legal",
      contactTitle: "Contact",
      contactCardText:
        "Questions about programs, consultation, or business cooperation? Use the contact page as your central starting point.",
      contactCardButton: "Open Contact",
      "links.home": "Home",
      "links.about": "About",
      "links.programs": "Program",
      "links.calendar": "Live Calendar",
      "links.impressum": "Imprint",
      "links.privacy": "Privacy Policy",
      "links.contact": "Contact",
      "contactItems.availabilityLabel": "Availability",
      "contactItems.availabilityValue": "Online by appointment",
      "contactItems.languagesLabel": "Languages",
      "contactItems.languagesValue": "German and English",
      "contactItems.responseLabel": "Response",
      "contactItems.responseValue": "Business and counseling inquiries",
      copyright: "© 2026 Bewegesund. All rights reserved.",
    })[key] ?? key,
}));

describe("Footer", () => {
  it("renders the modern footer brand and contact CTA", () => {
    render(<Footer />);

    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
    expect(screen.getByTestId("footer-brand-link")).toHaveAttribute("href", "/en");
    expect(screen.getByTestId("footer-brand-icon")).toHaveAttribute("src", "/favicon.ico");
    expect(screen.getByTestId("footer-contact-cta")).toHaveAttribute("href", "/en/kontakt");
    expect(screen.getByTestId("footer-contact-cta")).toHaveTextContent("Open Contact");
  });

  it("keeps navigation, legal links, and contact metadata accessible", () => {
    render(<Footer />);

    expect(screen.getAllByTestId("footer-navigation-link")).toHaveLength(5);
    expect(screen.getAllByTestId("footer-legal-link")).toHaveLength(2);
    expect(screen.getByTestId("footer-contact-panel")).toHaveTextContent("Online by appointment");
    expect(screen.getByTestId("footer-contact-panel")).toHaveTextContent("German and English");
    expect(screen.getByTestId("footer-bottom")).toHaveTextContent("© 2026 Bewegesund. All rights reserved.");
  });
});
