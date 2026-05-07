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
        <section id="live" className="py-20 px-6 bg-zinc-900/50 border-y border-white/5">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic text-white">
                        {t("title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">{t("highlight")}</span>
                    </h2>
                    <Link href={`/${locale}/calendar`} className="text-orange-500 font-bold uppercase text-sm hover:underline">{t("viewAll")} →</Link>
                </div>

                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={`${item.date}-${item.time}-${item.title}`} className="flex flex-col md:flex-row items-center bg-black border border-white/10 p-6 rounded-2xl hover:border-orange-500 transition group">
                            {/* Date Box */}
                            <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0 md:bg-zinc-900 md:p-4 rounded-xl md:w-24 text-center mb-4 md:mb-0 mr-0 md:mr-8 border border-white/5 md:border-transparent">
                                <span className="text-orange-500 font-black uppercase text-sm md:text-xs tracking-wider">{item.day}</span>
                                <span className="text-white font-bold text-lg leading-none">{item.date}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black italic uppercase text-white mb-2">{item.title}</h3>
                                <div className="flex justify-center md:justify-start gap-6 text-zinc-400 text-sm font-medium">
                                    <span className="flex items-center gap-2"><Clock size={16} className="text-orange-600"/> {item.time}</span>
                                    <span className="flex items-center gap-2"><Users size={16} className="text-orange-600"/> {t("spots", { count: item.spots })}</span>
                                </div>
                            </div>

                            {/* Action */}
                            <button className="mt-4 md:mt-0 px-6 py-3 bg-white text-black font-black uppercase text-sm rounded hover:bg-orange-500 hover:text-white transition transform skew-x-[-10deg]">
                                <span className="inline-block skew-x-[10deg]">{t("book")}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
