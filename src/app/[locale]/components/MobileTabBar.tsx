"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, CalendarDays, Dumbbell, Home, Sparkles } from "lucide-react";
import styles from "./MobileTabBar.module.css";

interface MobileTabBarProps {
  locale: string;
}

export default function MobileTabBar({ locale }: MobileTabBarProps) {
  const t = useTranslations("mobileTabs");
  const pathname = usePathname();
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
      active: pathname.startsWith(`/${locale}/courses`),
    },
    {
      key: "calendar",
      href: `/${locale}/calendar`,
      label: t("tabs.calendar"),
      icon: CalendarDays,
      active: pathname.startsWith(`/${locale}/calendar`),
      center: true,
    },
    {
      key: "relaxation",
      href: `/${locale}/meditation-relaxation`,
      label: t("tabs.relaxation"),
      icon: Sparkles,
      active: pathname.startsWith(`/${locale}/meditation-relaxation`),
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
    <nav
      className={styles.tabBar}
      aria-label={t("ariaLabel")}
      data-testid="mobile-tab-bar"
    >
      <div className={styles.tabRail}>
        {tabs.map((item) => {
          const Icon = item.icon;

          if (item.center) {
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-label={item.label}
                aria-current={item.active ? "page" : undefined}
                className={`${styles.centerAction} ${item.active ? styles.centerActionActive : ""}`}
                data-testid={`mobile-tab-${item.key}`}
              >
                <CalendarDays size={24} />
              </Link>
            );
          }

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
  );
}
