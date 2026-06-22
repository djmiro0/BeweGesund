"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Languages,
  Mail,
  ShieldCheck,
} from "lucide-react";
import style from "./Footer.module.css";

const Footer: React.FC = () => {
  const t = useTranslations("footer");
  const locale = useLocale();

  const navigationLinks = [
    { href: `/${locale}`, label: t("links.home") },
    { href: `/${locale}/about`, label: t("links.about") },
    { href: `/${locale}/courses`, label: t("links.courses") },
    { href: `/${locale}/calendar`, label: t("links.calendar") },
    { href: `/${locale}/meditation-entspannung`, label: t("links.relaxation") },
    { href: `/${locale}/blogs`, label: t("links.blogs") },
    { href: `/${locale}/kontakt`, label: t("links.contact") },
  ];

  const legalLinks = [
    { href: `/${locale}/impressum`, label: t("links.impressum"), icon: FileText },
    { href: `/${locale}/datenschutz`, label: t("links.privacy"), icon: ShieldCheck },
    { href: `/${locale}/nutzungsbedingungen`, label: t("links.terms"), icon: FileText },
  ];

  const contactItems = [
    { label: t("contactItems.availabilityLabel"), value: t("contactItems.availabilityValue") },
    { label: t("contactItems.languagesLabel"), value: t("contactItems.languagesValue") },
    { label: t("contactItems.responseLabel"), value: t("contactItems.responseValue") },
  ];

  return (
      <footer className={style.footer} data-testid="site-footer">
        <div className={style.footerInner}>
          <div className={style.brandColumn}>
            <Link href={`/${locale}`} className={style.brandMark} data-testid="footer-brand-link">
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

            <Link href={`/${locale}/kontakt`} className={style.contactButton} data-testid="footer-contact-cta">
              {t("contactCardButton")}
              <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className={style.footerContent}>
            <div className={style.contactPanel} data-testid="footer-contact-panel">
              <div>
                <p className={style.panelLabel}>{t("contactTitle")}</p>
                <p className={style.panelText}>{t("contactCardText")}</p>
              </div>

              <div className={style.metaList}>
                {contactItems.map((item, index) => {
                  const Icon = index === 0 ? CalendarDays : index === 1 ? Languages : Mail;

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

            <div className={style.linksGrid} data-testid="footer-link-grid">
              <section className={style.linkSection}>
                <h3 className={style.sectionTitle}>{t("navigationTitle")}</h3>

                <div className={style.linkList}>
                  {navigationLinks.map((link) => (
                      <Link key={link.href} href={link.href} className={style.footerLink} data-testid="footer-navigation-link">
                        <span>{link.label}</span>
                        <ArrowUpRight size={14} />
                      </Link>
                  ))}
                </div>
              </section>

              <section className={style.linkSection}>
                <h3 className={style.sectionTitle}>{t("legalTitle")}</h3>

                <div className={style.linkList}>
                  {legalLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                        <Link key={link.href} href={link.href} className={style.footerLink} data-testid="footer-legal-link">
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
