import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
      tagline:
        "Movement, rehabilitation, and education with a clearer path toward healthier everyday life.",
      navigationTitle: "Navigation",
      followTitle: "Follow us",
      legalTitle: "Legal",
      contactTitle: "Contact",
      contactCardText:
        "Questions about programs, consultation, or business cooperation? Use the contact page as your central starting point.",
      contactCardButton: "Open Contact",
      "newsletter.eyebrow": "Newsletter",
      "newsletter.title": "Don't miss the launch.",
      "newsletter.text":
        "Launch date, new programs, and BeweGesund news — straight to your inbox.",
      "newsletter.emailLabel": "Email address",
      "newsletter.placeholder": "name@example.com",
      "newsletter.submit": "Get updates",
      "newsletter.submitting": "Signing you up",
      "newsletter.success": "You're on the list — we'll keep you updated.",
      "newsletter.error": "We couldn't sign you up. Please try again.",
      "newsletter.privacy":
        "By signing up, you'll receive BeweGesund news by email. Unsubscribe anytime. Details in our",
      "newsletter.privacyLink": "Privacy Policy",
      "links.home": "Home",
      "links.about": "About",
      "links.programs": "Program",
      "links.courses": "Courses",
      "links.calendar": "Live Calendar",
      "links.relaxation": "Meditation & Relaxation",
      "links.blogs": "Blogs",
      "links.impressum": "Imprint",
      "links.privacy": "Privacy Policy",
      "links.terms": "Terms of Service",
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the modern footer brand and contact CTA", () => {
    render(<Footer />);

    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
    expect(screen.getByTestId("footer-brand-link")).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByTestId("footer-brand-icon")).toHaveAttribute(
      "src",
      "/logo.png",
    );
    expect(screen.getByTestId("footer-contact-cta")).toHaveAttribute(
      "href",
      "/en/contact",
    );
    expect(screen.getByTestId("footer-contact-cta")).toHaveTextContent(
      "Open Contact",
    );
  });

  it("keeps navigation, legal links, and contact metadata accessible", () => {
    render(<Footer />);

    expect(screen.getAllByTestId("footer-navigation-link")).toHaveLength(7);
    expect(screen.getAllByTestId("footer-legal-link")).toHaveLength(3);
    expect(screen.getAllByTestId("footer-social-link")).toHaveLength(3);
    expect(screen.getByTestId("footer-contact-panel")).toHaveTextContent(
      "Online by appointment",
    );
    expect(screen.getByTestId("footer-contact-panel")).toHaveTextContent(
      "German and English",
    );
    expect(screen.getByTestId("footer-bottom")).toHaveTextContent(
      "© 2026 Bewegesund. All rights reserved.",
    );
  });

  it("can hide product navigation for the launch preview", () => {
    render(<Footer showNavigation={false} />);

    expect(screen.queryByText("Navigation")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("footer-navigation-link"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Follow us")).toBeInTheDocument();
  });

  it("subscribes an email address to launch updates", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    render(<Footer showNavigation={false} />);

    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "member@example.com",
    );
    await user.click(screen.getByRole("button", { name: /get updates/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/newsletter",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(
      await screen.findByText("You're on the list — we'll keep you updated."),
    ).toBeInTheDocument();

    const requestOptions = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(requestOptions.body))).toMatchObject({
      email: "member@example.com",
      website: "",
    });
  });
});
