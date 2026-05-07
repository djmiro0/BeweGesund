// components/ServicesSection.tsx
"use client";
import { useTranslations } from "next-intl";
import { Briefcase, Brain, CalendarCheck } from "lucide-react";

export default function Services({ isMember = false }: { isMember?: boolean }) {
    const t = useTranslations("services");
    const allCards = t.raw("cards") as Array<{
        id: string;
        title: string;
        desc: string;
        cta: string;
    }>;
    const cards = isMember ? allCards : allCards.filter((card) => card.id !== "consultation");

    const icons = {
        consultation: CalendarCheck,
        annualTraining: Brain,
        businessCooperation: Briefcase
    };

    return (
        <section id="services" className="py-20 px-6 bg-zinc-950">
            <div className="max-w-7xl mx-auto mb-10">
                <h2 className="text-4xl md:text-5xl font-black uppercase italic text-white">
                    {isMember ? t("memberTitle") : t("publicTitle")}
                </h2>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {cards.map((service) => {
                    const Icon = icons[service.id as keyof typeof icons] ?? CalendarCheck;

                    return (
                    <div key={service.id} className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-3xl border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110 duration-500">
                            <Icon size={120} className="text-orange-500" />
                        </div>

                        <div className="relative z-10">
                            <Icon size={48} className="text-orange-500 mb-6" />
                            <h3 className="text-3xl font-black italic uppercase text-white mb-4">{service.title}</h3>
                            <p className="text-zinc-400 mb-8 text-lg leading-relaxed max-w-sm">{service.desc}</p>
                            <button className="text-white font-bold uppercase tracking-widest border-b-2 border-orange-500 pb-1 hover:text-orange-500 transition">
                                {service.cta}
                            </button>
                        </div>
                    </div>
                )})}
            </div>
        </section>
    );
}
