"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Instagram,
  Languages,
  Linkedin,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Youtube,
} from "lucide-react";
import style from "./Footer.module.css";

interface FooterProps {
  showNavigation?: boolean;
}

type NewsletterStatus = "idle" | "submitting" | "success" | "error";

const socialLinks = [
  {
    href:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
      "https://www.instagram.com/bewegesund_sandra.miro?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href:
      process.env.NEXT_PUBLIC_LINKEDIN_URL ||
      "https://de.linkedin.com/in/sandra-mirosavljevic-a934bb114/de",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    href:
      process.env.NEXT_PUBLIC_YOUTUBE_URL ||
      "https://www.youtube.com/@bewegesund",
    label: "YouTube",
    icon: Youtube,
  },
] as const;

const Footer: React.FC<FooterProps> = ({ showNavigation = true }) => {
  const t = useTranslations("footer");
  const locale = useLocale();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] =
    useState<NewsletterStatus>("idle");

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterStatus("submitting");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newsletterEmail,
          website: formData.get("website"),
        }),
      });

      if (!response.ok) {
        throw new Error("Newsletter subscription failed.");
      }

      setNewsletterEmail("");
      setNewsletterStatus("success");
    } catch {
      setNewsletterStatus("error");
    }
  };

  const navigationLinks = [
    { href: `/${locale}`, label: t("links.home") },
    { href: `/${locale}/about`, label: t("links.about") },
    { href: `/${locale}/courses`, label: t("links.courses") },
    { href: `/${locale}/calendar`, label: t("links.calendar") },
    { href: `/${locale}/meditation-relaxation`, label: t("links.relaxation") },
    { href: `/${locale}/blogs`, label: t("links.blogs") },
    { href: `/${locale}/contact`, label: t("links.contact") },
  ];

  const legalLinks = [
    { href: `/${locale}/imprint`, label: t("links.impressum"), icon: FileText },
    {
      href: `/${locale}/privacy`,
      label: t("links.privacy"),
      icon: ShieldCheck,
    },
    { href: `/${locale}/terms`, label: t("links.terms"), icon: FileText },
  ];

  const contactItems = [
    {
      label: t("contactItems.availabilityLabel"),
      value: t("contactItems.availabilityValue"),
    },
    {
      label: t("contactItems.languagesLabel"),
      value: t("contactItems.languagesValue"),
    },
    {
      label: t("contactItems.responseLabel"),
      value: t("contactItems.responseValue"),
    },
  ];

  return (
    <footer className={style.footer} data-testid="site-footer">
      <div className={style.footerInner}>
        <section
          className={style.newsletter}
          aria-labelledby="footer-newsletter-title"
          data-testid="footer-newsletter"
        >
          <div className={style.newsletterIntro}>
            <p className={style.panelLabel}>{t("newsletter.eyebrow")}</p>
            <h2 id="footer-newsletter-title" className={style.newsletterTitle}>
              {t("newsletter.title")}
            </h2>
            <p className={style.newsletterText}>{t("newsletter.text")}</p>
          </div>

          <form
            className={style.newsletterForm}
            onSubmit={handleNewsletterSubmit}
            data-testid="footer-newsletter-form"
          >
            <div className={style.newsletterFieldRow}>
              <label
                htmlFor="footer-newsletter-email"
                className={style.visuallyHidden}
              >
                {t("newsletter.emailLabel")}
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  if (newsletterStatus !== "submitting") {
                    setNewsletterStatus("idle");
                  }
                }}
                placeholder={t("newsletter.placeholder")}
                autoComplete="email"
                required
                disabled={newsletterStatus === "submitting"}
                className={style.newsletterInput}
                aria-describedby="footer-newsletter-privacy footer-newsletter-status"
              />
              <button
                type="submit"
                className={style.newsletterButton}
                disabled={newsletterStatus === "submitting"}
              >
                {newsletterStatus === "submitting"
                  ? t("newsletter.submitting")
                  : t("newsletter.submit")}
                {newsletterStatus === "submitting" ? (
                  <LoaderCircle
                    size={17}
                    className={style.loadingIcon}
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowUpRight size={17} aria-hidden="true" />
                )}
              </button>
            </div>

            <div className={style.honeypot} aria-hidden="true">
              <label htmlFor="footer-newsletter-website">Website</label>
              <input
                id="footer-newsletter-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <p
              id="footer-newsletter-privacy"
              className={style.newsletterPrivacy}
            >
              {t("newsletter.privacy")}{" "}
              <Link href={`/${locale}/privacy`}>
                {t("newsletter.privacyLink")}
              </Link>
            </p>
            <p
              id="footer-newsletter-status"
              className={style.newsletterStatus}
              data-state={newsletterStatus}
              role={newsletterStatus === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {newsletterStatus === "success" && t("newsletter.success")}
              {newsletterStatus === "error" && t("newsletter.error")}
            </p>
          </form>
        </section>

        <div className={style.brandColumn}>
          <Link
            href={`/${locale}`}
            className={style.brandMark}
            data-testid="footer-brand-link"
          >
            <Image
              src="/logo.png"
              alt=""
              width={64}
              height={64}
              className={style.brandIcon}
              data-testid="footer-brand-icon"
            />
            <span className={style.brandTitle}>{t("brand")}</span>
          </Link>

          <p className={style.brandText}>{t("tagline")}</p>

          <Link
            href={`/${locale}/contact`}
            className={style.contactButton}
            data-testid="footer-contact-cta"
          >
            {t("contactCardButton")}
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className={style.footerContent}>
          <div
            className={style.contactPanel}
            data-testid="footer-contact-panel"
          >
            <div>
              <p className={style.panelLabel}>{t("contactTitle")}</p>
              <p className={style.panelText}>{t("contactCardText")}</p>
            </div>

            <div className={style.metaList}>
              {contactItems.map((item, index) => {
                const Icon =
                  index === 0 ? CalendarDays : index === 1 ? Languages : Mail;

                return (
                  <div key={item.label} className={style.metaItem}>
                    <span className={style.metaIcon}>
                      <Icon size={16} />
                    </span>
                    <span>
                      <span className={style.metaLabel}>{item.label}</span>
                      <span className={style.metaValue}>{item.value}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`${style.linksGrid} ${
              showNavigation ? "" : style.linksGridCompact
            }`}
            data-testid="footer-link-grid"
          >
            {showNavigation && (
              <section className={style.linkSection}>
                <h3 className={style.sectionTitle}>{t("navigationTitle")}</h3>

                <div className={style.linkList}>
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={style.footerLink}
                      data-testid="footer-navigation-link"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className={style.linkSection}>
              <h3 className={style.sectionTitle}>{t("legalTitle")}</h3>

              <div className={style.linkList}>
                {legalLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={style.footerLink}
                      data-testid="footer-legal-link"
                    >
                      <span className={style.linkWithIcon}>
                        <Icon size={15} />
                        {link.label}
                      </span>
                      <ArrowUpRight size={14} />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className={style.linkSection}>
              <h3 className={style.sectionTitle}>{t("followTitle")}</h3>

              <div className={style.linkList}>
                {socialLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={style.footerLink}
                      data-testid="footer-social-link"
                    >
                      <span className={style.linkWithIcon}>
                        <Icon size={16} />
                        {link.label}
                      </span>
                      <ArrowUpRight size={14} />
                    </a>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className={style.footerBottom} data-testid="footer-bottom">
        <p>{t("copyright")}</p>
        <a
          href="https://djmir0.de"
          target="_blank"
          rel="noopener noreferrer"
          className={style.developerLink}
        >
          <span>{t("developedBy")}</span>
          <Image
            src="/djmir0.png"
            alt="developed by djmir0"
            width={116}
            height={50}
            className={style.developerLogo}
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
