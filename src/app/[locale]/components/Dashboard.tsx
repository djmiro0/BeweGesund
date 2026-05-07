import { useTranslations } from "next-intl";

interface DashboardUser {
    name: string;
}

export default function Dashboard({ user }: { user: DashboardUser }) {
    const t = useTranslations("home.dashboard");

    return (
        <section id="dashboard" className="py-24 px-6 border-b border-white/5 bg-gradient-to-b from-zinc-900 to-zinc-950">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase text-white mb-2">
                        <span className="text-orange-500">{t("greeting", { name: user.name.split(" ")[0] })}</span>
                    </h1>
                    <p className="text-zinc-400">{t("ready")}</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-black border border-white/10 p-4 rounded-xl text-center">
                        <div className="text-2xl font-black text-white">12</div>
                        <div className="text-xs uppercase font-bold text-zinc-500">{t("stats.programs")}</div>
                    </div>
                    <div className="bg-black border border-white/10 p-4 rounded-xl text-center">
                        <div className="text-2xl font-black text-orange-500">3</div>
                        <div className="text-xs uppercase font-bold text-zinc-500">{t("stats.thisWeek")}</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
