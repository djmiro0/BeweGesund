import Link from "next/link";
import { ArrowRight, Music2, ScanHeart, Sparkles, Waves, Wind } from "lucide-react";
import { getTranslations } from "next-intl/server";
import styles from "./Relaxation.module.css";

const categoryIcons = [Sparkles, Music2, Wind, ScanHeart] as const;
const relaxationSubcategoryKeys = [
  "guided-meditation",
  "relaxation-music",
  "breathing-against-stress",
  "body-scan",
] as const;

export default async function MeditationRelaxationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "relaxation" });
  const categories = t.raw("categories") as Array<{ title: string; description: string }>;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <div className={styles.visual} aria-hidden="true">
          <span className={styles.visualRing} />
          <Waves size={74} />
        </div>
      </section>

      <section className={styles.categoryGrid} aria-label={t("categoryAria")}>
        {categories.map((category, index) => {
          const Icon = categoryIcons[index] ?? Sparkles;
          const subcategoryKey = relaxationSubcategoryKeys[index] ?? relaxationSubcategoryKeys[0];

          return (
            <Link
              key={category.title}
              href={`/${locale}/meditation-entspannung/${subcategoryKey}`}
              className={styles.categoryItem}
            >
              <div className={styles.categoryHead}>
                <span className={styles.categoryIcon}>
                  <Icon size={22} />
                </span>
                <span className={styles.categoryAction} aria-hidden="true">
                  <ArrowRight size={17} />
                </span>
              </div>
              <div>
                <h2>{category.title}</h2>
                <p>{category.description}</p>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
