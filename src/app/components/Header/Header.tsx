"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../../../../firebase.config";
import { signOut } from 'firebase/auth';
import { LogOut, Globe } from 'lucide-react';

interface HeaderProps {
    locale: string;
    user?: { email?: string } | null;
    openAuth?: () => void;
}

const Header: React.FC<HeaderProps> = ({ locale, user, openAuth }) => {
    const t = useTranslations("header");
    const router = useRouter();
    const pathname = usePathname();
    const [hash, setHash] = useState("");

    const otherLocale = locale === "en" ? "de" : "en";

    useEffect(() => {
        const syncHash = () => {
            setHash(window.location.hash);
        };

        syncHash();
        window.addEventListener("hashchange", syncHash);

        return () => window.removeEventListener("hashchange", syncHash);
    }, [pathname]);

    const navItems = [
        {
            key: "courses",
            href: `/${locale}/courses`,
            label: t("nav.courses"),
            active: pathname === `/${locale}/courses` && hash !== "#consultation",
        },
        {
            key: "calendar",
            href: `/${locale}/calendar`,
            label: t("nav.calendar"),
            active: pathname === `/${locale}/calendar`,
        },
        {
            key: "consultation",
            href: `/${locale}/courses#consultation`,
            label: t("nav.consultation"),
            active: pathname === `/${locale}/courses` && hash === "#consultation",
        },
        {
            key: "about",
            href: `/${locale}/about`,
            label: t("nav.about"),
            active: pathname === `/${locale}/about`,
        },
    ];

    const handleLanguageChange = () => {
        // Menja locale dok čuva trenutnu putanju
        const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
        router.push(newPath);
    };

    return (
        <header className="fixed top-0 w-full z-40 border-b border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.92)] h-20 px-6 flex items-center justify-between backdrop-blur-md">
            {/* LOGO */}
            <Link href={`/${locale}`} className="transition-opacity hover:opacity-80">
                <div className="text-2xl font-black text-[var(--highlight)] italic uppercase tracking-tighter">
                    S.BeweGesund<span className="text-[var(--text-light)]">.</span>
                </div>
            </Link>

            {/* NAVIGACIJA - Skrivena na mobilnom */}
            <nav className="hidden md:flex items-center gap-3 rounded-full border border-[rgba(var(--foreground-rgb),0.08)] bg-[rgba(var(--foreground-rgb),0.03)] px-3 py-2 backdrop-blur-md">
                {navItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        aria-current={item.active ? "page" : undefined}
                        onClick={() => setHash(item.href.includes("#") ? "#consultation" : "")}
                        className={`group relative overflow-hidden rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-all duration-300 ${
                            item.active
                                ? "text-[var(--text-light)]"
                                : "text-[var(--text-dim)] hover:text-[var(--text-light)]"
                        }`}
                    >
                        <span
                            className={`absolute inset-x-3 bottom-[0.38rem] h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,var(--highlight),var(--highlight-soft))] transition-transform duration-300 ${
                                item.active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                            }`}
                        />
                        <span
                            className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                item.active
                                    ? "bg-[radial-gradient(circle_at_bottom,_rgba(var(--accent-rgb),0.18),_transparent_68%)] shadow-[inset_0_0_0_1px_rgba(var(--accent-rgb),0.18)]"
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
                    className="flex items-center gap-1 text-xs font-black text-[var(--text-light)] bg-[rgba(var(--foreground-rgb),0.08)] px-3 py-1.5 rounded hover:bg-[rgba(var(--foreground-rgb),0.14)] transition-all border border-[var(--border-soft)]"
                >
                    <Globe size={14} />
                    {otherLocale.toUpperCase()}
                </button>

                <div className="h-6 w-[1px] bg-[rgba(var(--foreground-rgb),0.2)] mx-2" />

                {user ? (
                    <div className="flex items-center gap-6">
                        <span className="hidden lg:block text-sm font-bold text-[var(--text-dim)]">{user.email}</span>
                        <button
                            onClick={() => signOut(auth)}
                            className="text-[var(--highlight-strong)] flex items-center gap-2 text-sm font-black uppercase hover:text-[var(--highlight-soft)] transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:block">{t("signOut")}</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={openAuth}
                        className="bg-[var(--text-light)] text-[var(--text-on-warm)] px-6 py-2 font-black uppercase text-sm skew-x-[-10deg] hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] transition-all duration-300 group"
                    >
            <span className="inline-block skew-x-[10deg]">
              {t("signIn")}
            </span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
