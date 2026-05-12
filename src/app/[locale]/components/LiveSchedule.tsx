// components/LiveSchedule.tsx
"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import {  Clock, Users } from 'lucide-react';

export default function LiveSchedule() {
    const t = useTranslations("liveSchedule");
    const locale = useLocale();
    const items = t.raw("items") as Array<{
        day: string;
        date: string;
        time: string;
        title: string;
        spots: number;
    }>;

    return (
        <section id="live" className="py-20 px-6 bg-[rgba(var(--navy-rgb),0.62)] border-y border-[var(--border-soft)]">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic text-[var(--text-light)]">
                        {t("title")} <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,var(--highlight),var(--highlight-strong))]">{t("highlight")}</span>
                    </h2>
                    <Link href={`/${locale}/calendar`} className="text-[var(--highlight)] font-bold uppercase text-sm hover:underline">{t("viewAll")} →</Link>
                </div>

                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={`${item.date}-${item.time}-${item.title}`} className="flex flex-col md:flex-row items-center bg-[var(--surface-overlay)] border border-[var(--border-soft)] p-6 rounded-2xl hover:border-[var(--border-strong)] transition group">
                            {/* Date Box */}
                            <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0 md:bg-[rgba(var(--foreground-rgb),0.06)] md:p-4 rounded-xl md:w-24 text-center mb-4 md:mb-0 mr-0 md:mr-8 border border-[rgba(var(--foreground-rgb),0.06)] md:border-transparent">
                                <span className="text-[var(--highlight)] font-black uppercase text-sm md:text-xs tracking-wider">{item.day}</span>
                                <span className="text-[var(--text-light)] font-bold text-lg leading-none">{item.date}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black italic uppercase text-[var(--text-light)] mb-2">{item.title}</h3>
                                <div className="flex justify-center md:justify-start gap-6 text-[var(--text-dim)] text-sm font-medium">
                                    <span className="flex items-center gap-2"><Clock size={16} className="text-[var(--highlight)]"/> {item.time}</span>
                                    <span className="flex items-center gap-2"><Users size={16} className="text-[var(--highlight)]"/> {t("spots", { count: item.spots })}</span>
                                </div>
                            </div>

                            {/* Action */}
                            <button className="mt-4 md:mt-0 px-6 py-3 bg-[var(--text-light)] text-[var(--text-on-warm)] font-black uppercase text-sm rounded hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] transition transform skew-x-[-10deg]">
                                <span className="inline-block skew-x-[10deg]">{t("book")}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
