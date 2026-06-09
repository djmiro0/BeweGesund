"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, CalendarDays, Dumbbell, HeartPulse, Home, MessageCircle, Plus, X } from "lucide-react";
import styles from "./MobileTabBar.module.css";

interface MobileTabBarProps {
  locale: string;
  user?: { email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  openAuth?: () => void;
}

export default function MobileTabBar({ locale, user, openAuth }: MobileTabBarProps) {
  const headerT = useTranslations("header");
  const t = useTranslations("mobileTabs");
  const pathname = usePathname();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [mindEntry, setMindEntry] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("sbewegesund-mind-entry") ?? "";
  });
  const [savedMessage, setSavedMessage] = useState("");

  const openActions = () => {
    if (!user) {
      openAuth?.();
      return;
    }

    setSavedMessage("");
    setIsActionSheetOpen(true);
  };

  const saveMindEntry = () => {
    window.localStorage.setItem("sbewegesund-mind-entry", mindEntry);
    setSavedMessage(t("mind.saved"));
  };

  const tabs = [
    {
      key: "home",
      href: `/${locale}`,
      label: t("tabs.home"),
      icon: Home,
      active: pathname === `/${locale}`,
    },
    {
      key: "courses",
      href: `/${locale}/courses`,
      label: t("tabs.courses"),
      icon: Dumbbell,
      active: pathname === `/${locale}/courses`,
    },
    {
      key: "calendar",
      href: `/${locale}/calendar`,
      label: t("tabs.calendar"),
      icon: CalendarDays,
      active: pathname === `/${locale}/calendar`,
    },
    {
      key: "blogs",
      href: `/${locale}/blogs`,
      label: t("tabs.blogs"),
      icon: BookOpen,
      active: pathname.startsWith(`/${locale}/blogs`),
    },
  ];

  return (
    <>
      {isActionSheetOpen ? (
        <div className={styles.actionLayer} data-testid="mobile-tab-action-sheet">
          <button
            type="button"
            className={styles.actionBackdrop}
            aria-label={headerT("closeMenu")}
            onClick={() => setIsActionSheetOpen(false)}
          />
          <section className={styles.actionSheet} role="dialog" aria-modal="true" aria-label={t("actions.title")}>
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.sheetEyebrow}>{t("actions.eyebrow")}</p>
                <h2 className={styles.sheetTitle}>{t("actions.title")}</h2>
              </div>
              <button
                type="button"
                className={styles.sheetClose}
                aria-label={headerT("closeMenu")}
                onClick={() => setIsActionSheetOpen(false)}
                data-testid="mobile-action-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.quickActions}>
              <Link
                href={`/${locale}/calendar`}
                className={styles.quickAction}
                onClick={() => setIsActionSheetOpen(false)}
                data-testid="mobile-action-training"
              >
                <span className={styles.quickActionIcon}>
                  <CalendarDays size={18} />
                </span>
                <span>
                  <strong>{t("actions.trainingTitle")}</strong>
                  <small>{t("actions.trainingText")}</small>
                </span>
              </Link>

              <Link
                href={`/${locale}/kontakt`}
                className={styles.quickAction}
                onClick={() => setIsActionSheetOpen(false)}
                data-testid="mobile-action-consultation"
              >
                <span className={styles.quickActionIcon}>
                  <MessageCircle size={18} />
                </span>
                <span>
                  <strong>{t("actions.consultationTitle")}</strong>
                  <small>{t("actions.consultationText")}</small>
                </span>
              </Link>
            </div>

            <div className={styles.mindEntry} data-testid="mobile-mind-entry">
              <div className={styles.mindHeader}>
                <span className={styles.quickActionIcon}>
                  <HeartPulse size={18} />
                </span>
                <div>
                  <h3>{t("mind.title")}</h3>
                  <p>{t("mind.description")}</p>
                </div>
              </div>
              <textarea
                value={mindEntry}
                onChange={(event) => {
                  setMindEntry(event.target.value);
                  setSavedMessage("");
                }}
                placeholder={t("mind.placeholder")}
                className={styles.mindTextarea}
                data-testid="mobile-mind-entry-input"
              />
              <div className={styles.mindFooter}>
                <span>{savedMessage || t("mind.hint")}</span>
                <button
                  type="button"
                  onClick={saveMindEntry}
                  className={styles.mindSave}
                  data-testid="mobile-mind-entry-save"
                >
                  {t("mind.save")}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <nav className={styles.tabBar} aria-label={t("ariaLabel")} data-testid="mobile-tab-bar">
        <div className={styles.tabRail}>
          {tabs.slice(0, 2).map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`${styles.tabItem} ${item.active ? styles.tabItemActive : ""}`}
                data-testid={`mobile-tab-${item.key}`}
              >
                <span className={styles.tabIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.tabLabel}>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className={styles.centerAction}
            aria-label={user ? t("actions.open") : headerT("signIn")}
            onClick={openActions}
            aria-expanded={isActionSheetOpen}
            data-testid="mobile-tab-primary-action"
          >
            <Plus size={24} />
          </button>

          {tabs.slice(2).map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`${styles.tabItem} ${item.active ? styles.tabItemActive : ""}`}
                data-testid={`mobile-tab-${item.key}`}
              >
                <span className={styles.tabIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.tabLabel}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
