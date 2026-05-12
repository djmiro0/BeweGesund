import { useTranslations } from "next-intl";

interface DashboardUser {
    name: string;
}

export default function Dashboard({ user }: { user: DashboardUser }) {
    const t = useTranslations("home.dashboard");

    return (
        <section id="dashboard" className="py-24 px-6 border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,#0b3854_0%,#003049_100%)]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase text-[var(--text-light)] mb-2">
                        <span className="text-[var(--highlight)]">{t("greeting", { name: user.name.split(" ")[0] })}</span>
                    </h1>
                    <p className="text-[var(--text-muted)]">{t("ready")}</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-[var(--surface-overlay)] border border-[var(--border-soft)] p-4 rounded-xl text-center">
                        <div className="text-2xl font-black text-[var(--text-light)]">12</div>
                        <div className="text-xs uppercase font-bold text-[var(--text-dim)]">{t("stats.programs")}</div>
                    </div>
                    <div className="bg-[var(--surface-overlay)] border border-[var(--border-soft)] p-4 rounded-xl text-center">
                        <div className="text-2xl font-black text-[var(--highlight)]">3</div>
                        <div className="text-xs uppercase font-bold text-[var(--text-dim)]">{t("stats.thisWeek")}</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
