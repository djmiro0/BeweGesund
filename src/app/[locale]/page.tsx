"use client";
import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useAuth } from "./components/AuthProvider";
import Dashboard from "./components/Dashboard";
import VideoSection from './components/VideoSection';
import LiveSchedule from './components/LiveSchedule';
import Services from './components/Services';
import HeroSection from "./components/HeroSection";
import BannerSection from "../components/BannerSection/BannerSection";

export default function HomePage() {
    const t = useTranslations("home");
    const locale = useLocale();
    const { user, loading, openAuth } = useAuth();
    const highlights = t.raw("public.highlights") as string[];
    const displayName = user?.displayName || user?.email?.split("@")[0] || "Member";

    if (loading) return <div className="bg-black h-screen flex items-center justify-center text-orange-500 font-bold">{t("loading")}</div>;

    return (
        <div className="bg-zinc-950 text-white min-h-screen">
            {user ? (
                <>
                    <Dashboard user={{ name: displayName }} />
                    <VideoSection />
                    <LiveSchedule />
                    <Services isMember />
                </>
            ) : (
                <>
                    <HeroSection openAuth={openAuth} />
                    <section className="relative overflow-hidden border-y border-white/5 bg-zinc-950 px-6 py-24">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),_transparent_30%)]" />
                        <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
                            <div>
                                <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-orange-300">{t("public.eyebrow")}</p>
                                <h2 className="max-w-3xl text-4xl font-black uppercase italic text-white md:text-6xl">
                                    {t("public.title")}
                                </h2>
                                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                                    {t("public.description")}
                                </p>
                                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                                    <Link href={`/${locale}/courses`} className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:bg-orange-500 hover:text-white">
                                        {t("public.primaryCta")}
                                        <ArrowRight size={16} />
                                    </Link>
                                    <button onClick={openAuth} className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:border-orange-500/40 hover:bg-white/10">
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
                                        <div key={item} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                                            <Icon className="mb-4 text-orange-400" size={20} />
                                            <p className="text-lg font-bold text-white">{item}</p>
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
