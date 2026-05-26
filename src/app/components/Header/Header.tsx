"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../../../../firebase.config";
import { signOut } from 'firebase/auth';
import { LogOut, Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from "@/app/[locale]/components/ThemeProvider";

interface HeaderProps {
    locale: string;
    user?: { email?: string } | null;
    openAuth?: () => void;
}

const Header: React.FC<HeaderProps> = ({ locale, user, openAuth }) => {
    const t = useTranslations("header");
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const otherLocale = locale === "en" ? "de" : "en";

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
        router.push(newPath);
    };

    return (
        <header className="fixed top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[var(--shell-border)] bg-[linear-gradient(180deg,rgba(var(--shell-bg-rgb),0.96),rgba(var(--shell-bg-alt-rgb),0.94))] px-6 text-[var(--shell-text)] shadow-[0_16px_40px_rgba(20,16,11,0.18)] backdrop-blur-xl">
            {/* LOGO */}
            <Link href={`/${locale}`} className="transition-opacity hover:opacity-80">
                <div className="text-2xl font-black italic uppercase tracking-tighter text-[var(--shell-text)]">
                    <span className="text-[var(--page-warm)]">S</span>.Bewe<span className="text-[var(--page-warm)]">Gesund</span>
                </div>
            </Link>

            {/* NAVIGACIJA - Skrivena na mobilnom */}
            <nav className="hidden items-center gap-3 rounded-full border border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.04)] px-3 py-2 shadow-[inset_0_1px_0_rgba(var(--shell-text-rgb),0.04)] backdrop-blur-md md:flex">
                {navItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        aria-current={item.active ? "page" : undefined}
                        className={`group relative overflow-hidden rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-all duration-300 ${
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
                        <span className="relative z-10">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* ACTIONS: Jezik + Auth */}
            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <button
                    onClick={handleLanguageChange}
                    className="flex items-center gap-1 rounded-full border border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.09)] px-3 py-1.5 text-xs font-black text-[var(--shell-text)] transition-all hover:bg-[rgba(var(--shell-text-rgb),0.12)]"
                >
                    <Globe size={14} />
                    {otherLocale.toUpperCase()}
                </button>

                <button
                    onClick={toggleTheme}
                    aria-label={theme === "light" ? t("themeDark") : t("themeLight")}
                    title={theme === "light" ? t("themeDark") : t("themeLight")}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition-all
        ${
                        theme === "dark"
                            ? "border-[var(--background)] bg-[var(--primary)] text-[var(--background)] hover:opacity-90"
                            : "border-[var(--shell-border)] bg-[rgba(var(--shell-text-rgb),0.09)] text-[var(--shell-text)] hover:bg-[rgba(var(--shell-text-rgb),0.12)]"
                    }`}
                >
                    {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                    <span className="hidden sm:inline">{theme === "light" ? t("darkMode") : t("lightMode")}</span>
                </button>

                <div className="mx-2 h-6 w-[1px] bg-[rgba(var(--shell-text-rgb),0.14)]" />

                {user ? (
                    <div className="flex items-center gap-6">
                        <span className="hidden text-sm font-bold text-[rgba(var(--shell-text-rgb),0.56)] lg:block">{user.email}</span>
                        <button
                            onClick={() => signOut(auth)}
                            className="flex items-center gap-2 text-sm font-black uppercase text-[var(--page-accent)] transition-colors hover:text-[var(--page-warm)]"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:block">{t("signOut")}</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={openAuth}
                        className="group rounded-full bg-[var(--shell-text)] px-6 py-2 text-sm font-black uppercase text-[var(--shell-bg)] transition-all duration-300 hover:bg-[var(--page-accent)] hover:text-[var(--shell-text)]"
                    >
            <span className="inline-block">
              {t("signIn")}
            </span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
