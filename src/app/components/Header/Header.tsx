"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../../../../firebase.config";
import { signOut } from 'firebase/auth';
import { LogOut, Globe, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from "@/app/[locale]/components/ThemeProvider";
import ProfileAvatar from "@/app/components/ProfileAvatar/ProfileAvatar";
import styles from "./Header.module.css";

interface HeaderProps {
    locale: string;
    user?: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
    profileName?: string | null;
    profilePhoto?: string | null;
    openAuth?: () => void;
    launchMode?: boolean;
}

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

    const otherLocale = locale === "en" ? "de" : "en";
    const profileName = storedProfileName || user?.displayName?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || t("profileFallback");
    const profilePhoto = storedProfilePhoto || user?.photoURL;
    const profileInitial = profileName.charAt(0).toUpperCase();

    const navItems = launchMode && !user ? [] : [
        {
            key: "program",
            href: user ? `/${locale}` : `/${locale}/courses`,
            label: t("nav.program"),
            active: user ? pathname === `/${locale}` : pathname === `/${locale}/courses`,
        },
        ...(user
            ? [{
                key: "courses",
                href: `/${locale}/courses`,
                label: t("nav.courses"),
                active: pathname === `/${locale}/courses`,
            },]
            : []),
        {
            key: "calendar",
            href: `/${locale}/calendar`,
            label: t("nav.calendar"),
            active: pathname === `/${locale}/calendar`,
        },
        {
            key: "blogs",
            href: `/${locale}/blogs`,
            label: t("nav.blogs"),
            active: pathname.startsWith(`/${locale}/blogs`),
        },
        {
            key: user ? "contact" : "about",
            href: user ? `/${locale}/kontakt` : `/${locale}/about`,
            label: user ? t("nav.contact") : t("nav.about"),
            active: user ? pathname === `/${locale}/kontakt` || pathname === `/${locale}/consultation` : pathname === `/${locale}/about`,
        },
    ];

    const handleLanguageChange = () => {
        // Menja locale dok čuva trenutnu putanju
        const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
        setIsMenuOpen(false);
        router.push(newPath);
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
            <span className={styles.profileName}>
                {profileName}
            </span>
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
                                <span
                                    className={`${styles.navUnderline} ${item.active ? styles.navUnderlineActive : ""}`}
                                />
                                <span
                                    className={`${styles.navGlow} ${item.active ? styles.navGlowActive : ""}`}
                                />
                                <span className={styles.navLabel}>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                ) : null}

                <div className={styles.actions}>
                    <button
                        onClick={handleLanguageChange}
                        className={styles.languageButton}
                    >
                        <Globe size={14} />
                        {otherLocale.toUpperCase()}
                    </button>

                    <button
                        onClick={toggleTheme}
                        data-testid="theme-toggle"
                        aria-label={theme === "light" ? t("themeDark") : t("themeLight")}
                        title={theme === "light" ? t("themeDark") : t("themeLight")}
                        className={`${styles.themeButton} ${theme === "dark" ? styles.themeButtonDark : ""}`}
                    >
                        {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                        <span className={styles.themeLabel}>{theme === "light" ? t("darkMode") : t("lightMode")}</span>
                    </button>

                    {user ? profileLink : (
                        <button
                            onClick={openAuth}
                            className={styles.signInButton}
                        >
                            {t("signIn")}
                        </button>
                    )}

                    {user ? (
                        <button
                            onClick={() => signOut(auth)}
                            className={styles.signOutButton}
                        >
                            <LogOut size={18} />
                            <span>{t("signOut")}</span>
                        </button>
                    ) : null}

                    {navItems.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen((open) => !open)}
                            data-testid="mobile-menu-trigger"
                            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
                            aria-expanded={isMenuOpen}
                            className={styles.menuButton}
                        >
                            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    ) : null}
                </div>
            </header>

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
                    data-testid="mobile-menu"
                    className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
                >
                    <nav className={styles.mobileNav}>
                        {navItems.map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                aria-current={item.active ? "page" : undefined}
                                className={`${styles.mobileNavLink} ${item.active ? styles.mobileNavLinkActive : ""}`}
                            >
                                {item.label}
                            </Link>
                        ))}

                        <div className={styles.mobileAuth}>
                            {user ? (
                                <button
                                    onClick={() => signOut(auth)}
                                    className={styles.mobileSignOut}
                                >
                                    <LogOut size={18} />
                                    {t("signOut")}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        openAuth?.();
                                    }}
                                    className={styles.mobileSignIn}
                                >
                                    {t("signIn")}
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
            ) : null}
        </>
    );
};

export default Header;
