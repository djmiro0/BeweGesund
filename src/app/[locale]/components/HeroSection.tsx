import { useTranslations } from "next-intl";

export default function HeroSection({ openAuth }: { openAuth?: () => void }) {
    const t = useTranslations("home.hero");

    return (
        <section className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-[radial-gradient(circle_at_20%_12%,rgba(var(--page-accent-rgb),0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(var(--page-olive-rgb),0.12),transparent_22%),linear-gradient(180deg,var(--page-cream-1),var(--page-cream-2))] px-6 pt-16 text-center sm:min-h-[calc(100svh-5rem)] sm:pt-20">
            <div className="max-w-4xl">
                <h1 className="mb-6 text-5xl font-black italic uppercase text-[var(--page-ink)] md:text-8xl">{t("title")}</h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-[var(--page-muted)] md:text-xl">{t("subtitle")}</p>
                <button onClick={openAuth} className="bg-[var(--button-primary-bg)] px-10 py-4 font-black uppercase text-[var(--page-base)] skew-x-[-12deg] hover:bg-[var(--button-primary-hover)]">
                    <span className="inline-block skew-x-[12deg]">{t("cta")}</span>
                </button>
            </div>
        </section>
    );
}
