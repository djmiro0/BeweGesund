"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../../../../firebase.config";
import { signOut } from 'firebase/auth';
import { LogOut, Globe, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from "@/app/[locale]/components/ThemeProvider";

interface HeaderProps {
    locale: string;
    user?: { email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
    openAuth?: () => void;
}

const Header: React.FC<HeaderProps> = ({ locale, user, openAuth }) => {
    const t = useTranslations("header");
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const otherLocale = locale === "en" ? "de" : "en";
    const profileName = user?.displayName || user?.email?.split("@")[0] || t("profileFallback");
    const profilePhoto = user?.photoURL;
    const profileInitial = profileName.charAt(0).toUpperCase();

    const navItems = [
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
            }]
            : []),
        {
            key: "calendar",
            href: `/${locale}/calendar`,
            label: t("nav.calendar"),
            active: pathname === `/${locale}/calendar`,
        },
        {
            key: "consultation",
            href: `/${locale}/consultation`,
            label: t("nav.consultation"),
            active: pathname === `/${locale}/consultation`,
        },
        {
            key: user ? "contact" : "about",
            href: user ? `/${locale}/kontakt` : `/${locale}/about`,
            label: user ? t("nav.contact") : t("nav.about"),
            active: user ? pathname === `/${locale}/kontakt` : pathname === `/${locale}/about`,
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
            className={`group flex min-w-0 items-center gap-2 rounded-full border p-1 pr-2 transition-all sm:pr-3 ${
                pathname === `/${locale}/profile`
                    ? "border-[rgba(var(--page-accent-rgb),0.35)] bg-[rgba(var(--page-accent-rgb),0.12)]"
                    : "border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.07)] hover:bg-[rgba(var(--shell-text-rgb),0.12)]"
            }`}
        >
            <span
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--page-accent),var(--page-olive))] bg-cover bg-center text-xs font-black text-[var(--shell-bg)] sm:h-9 sm:w-9 sm:text-sm"
                role="img"
                aria-label={t("profileAvatarAlt", { name: profileName })}
                style={profilePhoto ? { backgroundImage: `url("${profilePhoto}")` } : undefined}
            >
                {profilePhoto ? null : profileInitial}
            </span>
            <span className="hidden max-w-28 truncate text-sm font-black text-[var(--shell-text)] xl:block">
                {profileName}
            </span>
        </Link>
    ) : null;

    return (
        <>
            <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[var(--shell-border)] bg-[linear-gradient(180deg,rgba(var(--shell-bg-rgb),0.97),rgba(var(--shell-bg-alt-rgb),0.95))] px-3 text-[var(--shell-text)] shadow-[0_16px_40px_rgba(20,16,11,0.18)] backdrop-blur-xl sm:h-20 sm:px-6">
                <Link href={`/${locale}`} className="min-w-0 shrink transition-opacity hover:opacity-80" onClick={() => setIsMenuOpen(false)}>
                    <div className="truncate text-lg font-black italic uppercase tracking-normal text-[var(--shell-text)] sm:text-2xl">
                        <span className="text-[var(--page-warm)]">S</span>.Bewe<span className="text-[var(--page-warm)]">Gesund</span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-1 rounded-full border border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.04)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(var(--shell-text-rgb),0.04)] backdrop-blur-md lg:flex xl:gap-2 xl:px-3 xl:py-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            aria-current={item.active ? "page" : undefined}
                            className={`group relative overflow-hidden rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] transition-all duration-300 xl:px-4 xl:text-sm ${
                                item.active
                                    ? "text-[var(--shell-text)]"
                                    : "text-[rgba(var(--shell-text-rgb),0.62)] hover:text-[var(--shell-text)]"
                            }`}
                        >
                            <span
                                className={`absolute inset-x-3 bottom-[0.38rem] h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,var(--page-accent),var(--page-warm),var(--page-olive))] transition-transform duration-300 ${
                                    item.active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                                }`}
                            />
                            <span
                                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                    item.active
                                        ? "bg-[radial-gradient(circle_at_bottom,_rgba(var(--page-accent-rgb),0.16),_transparent_68%)] shadow-[inset_0_0_0_1px_rgba(var(--shell-text-rgb),0.08)]"
                                        : "bg-transparent"
                                }`}
                            />
                            <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <button
                        onClick={handleLanguageChange}
                        className="flex h-9 items-center gap-1 rounded-full border border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.09)] px-2.5 text-xs font-black text-[var(--shell-text)] transition-all hover:bg-[rgba(var(--shell-text-rgb),0.12)] sm:px-3"
                    >
                        <Globe size={14} />
                        {otherLocale.toUpperCase()}
                    </button>

                    <button
                        onClick={toggleTheme}
                        aria-label={theme === "light" ? t("themeDark") : t("themeLight")}
                        title={theme === "light" ? t("themeDark") : t("themeLight")}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black transition-all sm:w-auto sm:gap-2 sm:px-3 ${
                            theme === "dark"
                                ? "border-[var(--background)] bg-[var(--primary)] text-[var(--background)] hover:opacity-90"
                                : "border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.09)] text-[var(--shell-text)] hover:bg-[rgba(var(--shell-text-rgb),0.12)]"
                        }`}
                    >
                        {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                        <span className="hidden sm:inline">{theme === "light" ? t("darkMode") : t("lightMode")}</span>
                    </button>

                    {user ? profileLink : (
                        <button
                            onClick={openAuth}
                            className="hidden rounded-full bg-[var(--shell-text)] px-5 py-2 text-sm font-black uppercase text-[var(--shell-bg)] transition-all duration-300 hover:bg-[var(--page-accent)] hover:text-[var(--shell-text)] sm:block"
                        >
                            {t("signIn")}
                        </button>
                    )}

                    {user ? (
                        <button
                            onClick={() => signOut(auth)}
                            className="hidden items-center gap-2 text-sm font-black uppercase text-[var(--page-accent)] transition-colors hover:text-[var(--page-warm)] lg:flex"
                        >
                            <LogOut size={18} />
                            <span>{t("signOut")}</span>
                        </button>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen((open) => !open)}
                        aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
                        aria-expanded={isMenuOpen}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.09)] text-[var(--shell-text)] transition-all hover:bg-[rgba(var(--shell-text-rgb),0.12)] lg:hidden"
                    >
                        {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </header>

            <div
                className={`fixed left-0 right-0 top-16 z-30 border-b border-[var(--shell-border)] bg-[linear-gradient(180deg,rgba(var(--shell-bg-rgb),0.98),rgba(var(--shell-bg-alt-rgb),0.98))] px-3 py-4 text-[var(--shell-text)] shadow-[0_18px_42px_rgba(20,16,11,0.24)] backdrop-blur-xl transition-all duration-300 sm:top-20 sm:px-6 lg:hidden ${
                    isMenuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
                }`}
            >
                <nav className="mx-auto flex max-w-3xl flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-current={item.active ? "page" : undefined}
                            className={`rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.1em] ${
                                item.active
                                    ? "border-[rgba(var(--page-accent-rgb),0.32)] bg-[rgba(var(--page-accent-rgb),0.14)] text-[var(--shell-text)]"
                                    : "border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.06)] text-[rgba(var(--shell-text-rgb),0.76)]"
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}

                    <div className="mt-2 border-t border-[var(--shell-border)] pt-3">
                        {user ? (
                            <button
                                onClick={() => signOut(auth)}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(var(--page-accent-rgb),0.28)] bg-[rgba(var(--page-accent-rgb),0.1)] px-4 py-3 text-sm font-black uppercase tracking-[0.1em] text-[var(--page-accent)]"
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
                                className="w-full rounded-2xl bg-[var(--shell-text)] px-4 py-3 text-sm font-black uppercase tracking-[0.1em] text-[var(--shell-bg)]"
                            >
                                {t("signIn")}
                            </button>
                        )}
                    </div>
                </nav>
            </div>
        </>
    );
};

export default Header;
