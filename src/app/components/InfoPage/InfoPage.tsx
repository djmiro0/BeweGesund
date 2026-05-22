"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import styles from "./InfoPage.module.css";

interface InfoSection {
  title: string;
  body: string;
}

interface InfoPageProps {
  title: string;
  intro: string;
  sections: InfoSection[];
  note: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function InfoPage({
  title,
  intro,
  sections,
  note,
  ctaLabel,
  ctaHref,
}: InfoPageProps) {
  const locale = useLocale();

  return (
    <section className={styles.pageShell}>
      <div className={styles.pageInner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>S.BeweGesund</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.intro}>{intro}</p>
          {ctaLabel && ctaHref ? (
            <Link href={`/${locale}${ctaHref}`} className={styles.cta}>
              {ctaLabel}
            </Link>
          ) : null}
        </header>

        <div className={styles.sectionGrid}>
          {sections.map((section) => (
            <article key={section.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardBody}>{section.body}</p>
            </article>
          ))}
        </div>

        <div className={styles.noteBlock}>
          <p>{note}</p>
        </div>
      </div>
    </section>
  );
}
