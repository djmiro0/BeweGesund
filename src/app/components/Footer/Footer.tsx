"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FileText, Mail, ShieldCheck } from "lucide-react";
import style from "./Footer.module.css";

const Footer: React.FC = () => {
  const t = useTranslations("footer");
  const locale = useLocale();

  const navigationLinks = [
    { href: `/${locale}`, label: t("links.home") },
    { href: `/${locale}/about`, label: t("links.about") },
    { href: `/${locale}/courses`, label: t("links.programs") },
    { href: `/${locale}/calendar`, label: t("links.calendar") },
    { href: `/${locale}/consultation`, label: t("links.consultation") },
  ];

  const legalLinks = [
    { href: `/${locale}/impressum`, label: t("links.impressum"), icon: FileText },
    { href: `/${locale}/datenschutz`, label: t("links.privacy"), icon: ShieldCheck },
    { href: `/${locale}/kontakt`, label: t("links.contact"), icon: Mail },
  ];

  const contactItems = [
    { label: t("contactItems.availabilityLabel"), value: t("contactItems.availabilityValue") },
    { label: t("contactItems.languagesLabel"), value: t("contactItems.languagesValue") },
    { label: t("contactItems.responseLabel"), value: t("contactItems.responseValue") },
  ];

  return (
    <footer className={style.footer}>
      <div className={style.footerInner}>
        <div className={style.brandColumn}>
          <p className={style.brandEyebrow}>{t("brand")}</p>
          <h2 className={style.brandTitle}>{t("brand")}</h2>
          <p className={style.brandText}>{t("tagline")}</p>
        </div>

        <div className={style.linksGrid}>
          <section className={style.linkSection}>
            <h3 className={style.sectionTitle}>{t("navigationTitle")}</h3>
            <div className={style.linkList}>
              {navigationLinks.map((link) => (
                <Link key={link.href} href={link.href} className={style.footerLink}>
                  <span>{link.label}</span>
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
                  <Link key={link.href} href={link.href} className={style.footerLink}>
                    <span className={style.linkWithIcon}>
                      <Icon size={15} />
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className={style.linkSection}>
            <h3 className={style.sectionTitle}>{t("contactTitle")}</h3>
            <div className={style.linkList}>
              <Link href={`/${locale}/kontakt`} className={style.footerLink}>
                <span className={style.linkWithIcon}>
                  <Mail size={15} />
                  {t("links.contact")}
                </span>
              </Link>
            </div>
            <div className={style.metaList}>
              {contactItems.map((item) => (
                <div key={item.label} className={style.metaItem}>
                  <span className={style.metaLabel}>{item.label}</span>
                  <span className={style.metaValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className={style.footerBottom}>
        <p>{t("copyright")}</p>
      </div>
    </footer>
  );
};

export default Footer;
