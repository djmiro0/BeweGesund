"use client";

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

    const otherLocale = locale === "en" ? "de" : "en";

    const handleLanguageChange = () => {
        // Menja locale dok čuva trenutnu putanju
        const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
        router.push(newPath);
    };

    return (
        <header className="fixed top-0 w-full z-40 bg-black/90 border-b border-white/10 h-20 px-6 flex items-center justify-between">
            {/* LOGO */}
            <Link href={`/${locale}`} className="transition-opacity hover:opacity-80">
                <div className="text-2xl font-black text-orange-500 italic uppercase tracking-tighter">
                    S.BeweGesund<span className="text-white">.</span>
                </div>
            </Link>

            {/* NAVIGACIJA - Skrivena na mobilnom */}
            <nav className="hidden md:flex items-center gap-8">
                <Link href={`/${locale}/courses`} className="text-sm font-bold text-zinc-400 hover:text-white uppercase transition-colors">
                    {t("nav.courses")}
                </Link>
                <Link href={`/${locale}/calendar`} className="text-sm font-bold text-zinc-400 hover:text-white uppercase transition-colors">
                    {t("nav.calendar")}
                </Link>
                <Link href={`/${locale}/courses#consultation`} className="text-sm font-bold text-zinc-400 hover:text-white uppercase transition-colors">
                    {t("nav.consultation")}
                </Link>
                <Link href={`/${locale}/about`} className="text-sm font-bold text-zinc-400 hover:text-white uppercase transition-colors">
                    {t("nav.about")}
                </Link>
            </nav>

            {/* ACTIONS: Jezik + Auth */}
            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <button
                    onClick={handleLanguageChange}
                    className="flex items-center gap-1 text-xs font-black text-white bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-all border border-white/10"
                >
                    <Globe size={14} />
                    {otherLocale.toUpperCase()}
                </button>

                <div className="h-6 w-[1px] bg-white/20 mx-2" />

                {user ? (
                    <div className="flex items-center gap-6">
                        <span className="hidden lg:block text-sm font-bold text-zinc-500">{user.email}</span>
                        <button
                            onClick={() => signOut(auth)}
                            className="text-red-500 flex items-center gap-2 text-sm font-black uppercase hover:text-red-400 transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:block">{t("signOut")}</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={openAuth}
                        className="bg-white text-black px-6 py-2 font-black uppercase text-sm skew-x-[-10deg] hover:bg-orange-500 hover:text-white transition-all duration-300 group"
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
