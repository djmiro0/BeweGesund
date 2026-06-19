"use client";

import { Music2, ScanHeart, Sparkles, Waves, Wind } from "lucide-react";
import { useTranslations } from "next-intl";
import RelaxationMusicPlayer from "./RelaxationMusicPlayer";
import styles from "./Relaxation.module.css";

const categoryIcons = [Sparkles, Music2, Wind, ScanHeart] as const;

export default function MeditationRelaxationPage() {
  const t = useTranslations("relaxation");
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

          return (
            <article key={category.title} className={styles.categoryItem}>
              <span className={styles.categoryIcon}>
                <Icon size={22} />
              </span>
              <h2>{category.title}</h2>
              <p>{category.description}</p>
            </article>
          );
        })}
      </section>

      <section className={styles.musicSection} aria-labelledby="relaxation-music-title">
        <div className={styles.musicIntro}>
          <div className={styles.musicHeading}>
            <p className={styles.eyebrow}>{t("music.eyebrow")}</p>
            <h2 id="relaxation-music-title">{t("music.title")}</h2>
          </div>
          <div className={styles.musicText}>
            {(t.raw("music.paragraphs") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <RelaxationMusicPlayer />
      </section>
    </main>
  );
}
