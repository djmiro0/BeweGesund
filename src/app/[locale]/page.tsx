"use client";
import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useAuth } from "./components/AuthProvider";
import Dashboard from "./components/Dashboard";
import HeroSection from "./components/HeroSection";
import BannerSection from "../components/BannerSection/BannerSection";

export default function HomePage() {
    const t = useTranslations("home");
    const locale = useLocale();
    const { user, loading, openAuth } = useAuth();
    const highlights = t.raw("public.highlights") as string[];
    const displayName = user?.displayName || user?.email?.split("@")[0] || "Member";

    if (loading) return <div className="bg-[var(--background)] h-screen flex items-center justify-center text-[var(--highlight)] font-bold">{t("loading")}</div>;

    return (
        <div className="bg-[var(--background)] text-[var(--text-light)] min-h-screen">
            {user ? (
                <>
                    <Dashboard user={{ name: displayName }} />
                </>
            ) : (
                <>
                    <HeroSection openAuth={openAuth} />
                    <section className="relative overflow-hidden border-y border-[var(--border-soft)] bg-[var(--background)] px-6 py-24">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(var(--accent-rgb),0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(var(--accent-soft-rgb),0.1),_transparent_30%)]" />
                        <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
                            <div>
                                <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[var(--highlight-soft)]">{t("public.eyebrow")}</p>
                                <h2 className="max-w-3xl text-4xl font-black uppercase italic text-[var(--text-light)] md:text-6xl">
                                    {t("public.title")}
                                </h2>
                                <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
                                    {t("public.description")}
                                </p>
                                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                                    <Link href={`/${locale}/courses`} className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--text-light)] px-7 py-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)]">
                                        {t("public.primaryCta")}
                                        <ArrowRight size={16} />
                                    </Link>
                                    <button onClick={openAuth} className="inline-flex items-center justify-center gap-3 rounded-full border border-[var(--border-soft)] bg-[var(--button-secondary-bg)] px-7 py-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--text-light)] transition hover:border-[var(--border-strong)] hover:bg-[var(--button-secondary-hover)]">
                                        {t("public.secondaryCta")}
                                        <Sparkles size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                {highlights.map((item, index) => {
                                    const icons = [ShieldCheck, CalendarDays, Sparkles];
                                    const Icon = icons[index] ?? Sparkles;
                                    return (
                                        <div key={item} className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[rgba(var(--foreground-rgb),0.03)] p-5 backdrop-blur-sm">
                                            <Icon className="mb-4 text-[var(--highlight-soft)]" size={20} />
                                            <p className="text-lg font-bold text-[var(--text-light)]">{item}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                    <BannerSection />
                </>
            )}
        </div>
    );
}
