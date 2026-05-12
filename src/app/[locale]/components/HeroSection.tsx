import { useTranslations } from "next-intl";

export default function HeroSection({ openAuth }: { openAuth?: () => void }) {
    const t = useTranslations("home.hero");

    return (
        <section className="h-screen flex items-center justify-center text-center px-6">
            <div className="max-w-4xl">
                <h1 className="text-5xl md:text-8xl font-black italic mb-6 text-[var(--text-light)]">{t("title")}</h1>
                <p className="text-lg md:text-xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">{t("subtitle")}</p>
                <button onClick={openAuth} className="bg-[var(--button-primary-bg)] px-10 py-4 text-[var(--text-light)] font-black uppercase skew-x-[-12deg] hover:bg-[var(--button-primary-hover)]">
                    <span className="inline-block skew-x-[12deg]">{t("cta")}</span>
                </button>
            </div>
        </section>
    );
}
