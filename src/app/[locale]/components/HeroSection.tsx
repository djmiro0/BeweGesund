import { useTranslations } from "next-intl";

export default function HeroSection({ openAuth }: { openAuth?: () => void }) {
    const t = useTranslations("home.hero");

    return (
        <section className="h-screen flex items-center justify-center text-center px-6">
            <div className="max-w-4xl">
                <h1 className="text-5xl md:text-8xl font-black italic mb-6">{t("title")}</h1>
                <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">{t("subtitle")}</p>
                <button onClick={openAuth} className="bg-orange-600 px-10 py-4 font-black uppercase skew-x-[-12deg]">
                    <span className="inline-block skew-x-[12deg]">{t("cta")}</span>
                </button>
            </div>
        </section>
    );
}
