"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Languages,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "@/app/[locale]/components/ThemeProvider";
import { useModalDialog } from "@/app/[locale]/components/useModalDialog";
import ProfileAvatar from "@/app/components/ProfileAvatar/ProfileAvatar";
import styles from "./Header.module.css";

interface HeaderProps {
  locale: string;
  user?: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  } | null;
  profileName?: string | null;
  profilePhoto?: string | null;
  openAuth?: () => void;
  launchMode?: boolean;
}

const LANGUAGE_OPTIONS = [
  { code: "de", shortLabel: "DE", name: "Deutsch" },
  { code: "en", shortLabel: "EN", name: "English" },
];

const Header: React.FC<HeaderProps> = ({
  locale,
  user,
  profileName: storedProfileName,
  profilePhoto: storedProfilePhoto,
  openAuth,
  launchMode = false,
}) => {
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageSwitcherRef = useRef<HTMLDivElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  const activeLanguageOptionRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useModalDialog<HTMLDivElement>(isMenuOpen, () =>
    setIsMenuOpen(false),
  );

  useEffect(() => {
    if (!isLanguageOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setIsLanguageOpen(false);
      languageTriggerRef.current?.focus();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isLanguageOpen]);

  useEffect(() => {
    if (!isLanguageOpen) return;

    const focusFrame = window.requestAnimationFrame(() => {
      activeLanguageOptionRef.current?.focus();
    });
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!languageSwitcherRef.current?.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("click", closeOnOutsideClick);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("click", closeOnOutsideClick);
    };
  }, [isLanguageOpen]);

  const profileName =
    storedProfileName ||
    user?.displayName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    t("profileFallback");
  const profilePhoto = storedProfilePhoto || user?.photoURL;
  const profileInitial = profileName.charAt(0).toUpperCase();

  const navItems =
    launchMode && !user
      ? []
      : [
          {
            key: "home",
            href: user ? `/${locale}` : `/${locale}/courses`,
            label: t("nav.home"),
            active: user
              ? pathname === `/${locale}`
              : pathname === `/${locale}/courses`,
          },
          ...(user
            ? [
                {
                  key: "courses",
                  href: `/${locale}/courses`,
                  label: t("nav.courses"),
                  active: pathname.startsWith(`/${locale}/courses`),
                },
              ]
            : []),
          {
            key: "calendar",
            href: `/${locale}/calendar`,
            label: t("nav.calendar"),
            active: pathname === `/${locale}/calendar`,
          },
          {
            key: "relaxation",
            href: `/${locale}/meditation-relaxation`,
            label: t("nav.relaxation"),
            active: pathname.startsWith(`/${locale}/meditation-relaxation`),
          },
          {
            key: "blogs",
            href: `/${locale}/blogs`,
            label: t("nav.blogs"),
            active: pathname.startsWith(`/${locale}/blogs`),
          },
          {
            key: user ? "contact" : "about",
            href: user ? `/${locale}/contact` : `/${locale}/about`,
            label: user ? t("nav.contact") : t("nav.about"),
            active: user
              ? pathname === `/${locale}/contact` ||
                pathname === `/${locale}/consultation`
              : pathname === `/${locale}/about`,
          },
        ];

  const handleLanguageChange = (nextLocale: string) => {
    setIsLanguageOpen(false);
    if (nextLocale === locale) {
      languageTriggerRef.current?.focus();
      return;
    }

    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    setIsMenuOpen(false);
    router.push(newPath);
  };

  const handleLanguageKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }

    const options = Array.from(
      languageSwitcherRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="option"]',
      ) ?? [],
    );
    if (options.length === 0) return;

    event.preventDefault();
    const currentIndex = options.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : event.key === "ArrowDown"
            ? (currentIndex + 1) % options.length
            : (currentIndex - 1 + options.length) % options.length;

    options[nextIndex]?.focus();
  };

  const profileLink = user ? (
    <Link
      href={`/${locale}/profile`}
      onClick={() => setIsMenuOpen(false)}
      aria-label={t("profileLink")}
      aria-current={pathname === `/${locale}/profile` ? "page" : undefined}
      className={`${styles.profileLink} ${pathname === `/${locale}/profile` ? styles.profileLinkActive : ""}`}
    >
      <ProfileAvatar
        userId={user.uid}
        photoUrl={profilePhoto}
        initial={profileInitial}
        ariaLabel={t("profileAvatarAlt", { name: profileName })}
        className={styles.profileAvatar}
      />
      <span className={styles.profileName}>{profileName}</span>
    </Link>
  ) : null;

  return (
    <>
      <header className={styles.header}>
        <Link
          href={`/${locale}`}
          aria-label={t("logo")}
          data-testid="header-brand-link"
          className={styles.brandLink}
          onClick={() => setIsMenuOpen(false)}
        >
          <Image
            src="/logo.png"
            alt=""
            width={70}
            height={70}
            priority
            data-testid="header-brand-logo"
            className={styles.brandLogo}
          />
        </Link>

        {navItems.length > 0 ? (
          <nav className={styles.desktopNav}>
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={item.active ? "page" : undefined}
                className={`${styles.navLink} ${item.active ? styles.navLinkActive : ""}`}
              >
                {item.active ? (
                  <motion.span
                    layoutId="desktop-nav-aura"
                    className={styles.navAura}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null}
                <span
                  className={`${styles.navUnderline} ${item.active ? styles.navUnderlineActive : ""}`}
                />
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        <div className={styles.actions}>
          <div
            ref={languageSwitcherRef}
            className={styles.languageSwitcher}
            onKeyDown={handleLanguageKeyDown}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsLanguageOpen(false);
              }
            }}
          >
            <button
              ref={languageTriggerRef}
              type="button"
              className={`${styles.languageTrigger} ${isLanguageOpen ? styles.languageTriggerOpen : ""}`}
              aria-label={t("language")}
              aria-haspopup="listbox"
              aria-expanded={isLanguageOpen}
              aria-controls="language-chooser"
              onClick={() => {
                setIsMenuOpen(false);
                setIsLanguageOpen((open) => !open);
              }}
            >
              <span className={styles.languageOrb} aria-hidden="true">
                <Languages size={14} strokeWidth={2} />
              </span>
              <span>{locale.toUpperCase()}</span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={styles.languageChevron}
              />
            </button>

            {isLanguageOpen ? (
              <div
                id="language-chooser"
                role="dialog"
                aria-labelledby="language-chooser-title"
                className={styles.languagePanel}
              >
                <div className={styles.languagePanelIntro}>
                  <p id="language-chooser-title">{t("languageTitle")}</p>
                  <button
                    type="button"
                    aria-label={t("closeLanguage")}
                    className={styles.languagePanelClose}
                    onClick={() => {
                      setIsLanguageOpen(false);
                      languageTriggerRef.current?.focus();
                    }}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>

                <div
                  role="listbox"
                  aria-labelledby="language-chooser-title"
                  className={styles.languageOptions}
                >
                  {LANGUAGE_OPTIONS.map((language) => {
                    const isActive = language.code === locale;

                    return (
                      <button
                        key={language.code}
                        ref={isActive ? activeLanguageOptionRef : undefined}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        aria-label={`${language.name} (${language.shortLabel})`}
                        className={`${styles.languageOption} ${isActive ? styles.languageOptionActive : ""}`}
                        onClick={() => handleLanguageChange(language.code)}
                      >
                        <span className={styles.languageOptionCopy}>
                          <strong>{language.name}</strong>
                          <span>{language.shortLabel}</span>
                        </span>
                        <span className={styles.languageOptionState}>
                          {isActive ? (
                            <>
                              <Check size={16} aria-hidden="true" />
                              <span className={styles.visuallyHidden}>
                                {t("languageSelected")}
                              </span>
                            </>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            data-testid="theme-toggle"
            aria-label={theme === "light" ? t("themeDark") : t("themeLight")}
            title={theme === "light" ? t("themeDark") : t("themeLight")}
            className={`${styles.themeSwitch} ${theme === "dark" ? styles.themeSwitchDark : ""}`}
          >
            <span className={styles.themeIcon} aria-hidden="true">
              <Sun className={styles.themeSun} size={17} />
              <Moon className={styles.themeMoon} size={17} />
            </span>
          </button>

          {user ? (
            profileLink
          ) : (
            <button onClick={openAuth} className={styles.signInButton}>
              {t("signIn")}
            </button>
          )}

          {navItems.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setIsLanguageOpen(false);
                setIsMenuOpen((open) => !open);
              }}
              data-testid="mobile-menu-trigger"
              aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={isMenuOpen}
              className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ""}`}
            >
              <span className={styles.menuIcon} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          ) : null}
        </div>
      </header>

      {isLanguageOpen ? (
        <button
          type="button"
          aria-label={t("closeLanguage")}
          data-testid="language-menu-backdrop"
          className={styles.languageBackdrop}
          onClick={() => {
            setIsLanguageOpen(false);
            languageTriggerRef.current?.focus();
          }}
        />
      ) : null}

      {isMenuOpen ? (
        <button
          type="button"
          aria-label={t("closeMenu")}
          data-testid="mobile-menu-backdrop"
          className={styles.mobileBackdrop}
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      {navItems.length > 0 ? (
        <div
          ref={mobileMenuRef}
          data-testid="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen}
          tabIndex={-1}
          className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
        >
          <div className={styles.mobileMenuHeader}>
            <p id="mobile-menu-title">{t("menuTitle")}</p>
            <button
              type="button"
              aria-label={t("closeMenu")}
              onClick={() => setIsMenuOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <nav className={styles.mobileNav}>
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={item.active ? "page" : undefined}
                className={`${styles.mobileNavLink} ${item.active ? styles.mobileNavLinkActive : ""}`}
              >
                <span>{item.label}</span>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            ))}

            {!user ? (
              <div className={styles.mobileAuth}>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAuth?.();
                  }}
                  className={styles.mobileSignIn}
                >
                  {t("signIn")}
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
};

export default Header;
