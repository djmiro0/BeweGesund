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
        <div className="min-h-screen bg-[var(--page-base)] text-[var(--page-ink)]">
            {user ? (
                <>
                    <Dashboard user={{ name: displayName }} />
                </>
            ) : (
                <>
                    <HeroSection openAuth={openAuth} />
                    <section className="relative overflow-hidden border-y border-[var(--page-border)] bg-[var(--page-base)] px-6 py-24">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(var(--page-accent-rgb),0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(var(--page-warm-rgb),0.14),_transparent_30%)]" />
                        <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
                            <div>
                                <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[var(--page-warm)]">{t("public.eyebrow")}</p>
                                <h2 className="max-w-3xl text-4xl font-black uppercase italic text-[var(--page-ink)] md:text-6xl">
                                    {t("public.title")}
                                </h2>
                                <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--page-muted)]">
                                    {t("public.description")}
                                </p>
                                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                                    <Link href={`/${locale}/courses`} className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--page-ink)] px-7 py-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--page-base)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--page-base)]">
                                        {t("public.primaryCta")}
                                        <ArrowRight size={16} />
                                    </Link>
                                    <button onClick={openAuth} className="inline-flex items-center justify-center gap-3 rounded-full border border-[var(--page-border)] bg-[rgba(var(--page-ink-rgb),0.05)] px-7 py-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--page-ink)] transition hover:border-[rgba(var(--page-accent-rgb),0.3)] hover:bg-[rgba(var(--page-accent-rgb),0.1)]">
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
                                        <div key={item} className="rounded-[1.75rem] border border-[var(--page-border)] bg-[rgba(var(--page-soft-rgb),0.72)] p-5 shadow-[0_18px_44px_rgba(83,57,20,0.08)] backdrop-blur-sm">
                                            <Icon className="mb-4 text-[var(--page-warm)]" size={20} />
                                            <p className="text-lg font-bold text-[var(--page-ink)]">{item}</p>
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
