"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import styles from "./not-found.module.css";

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations("notFound");

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.text}>{t("description")}</p>
        <Link href={`/${locale}`} className={styles.button}>
          {t("action")}
        </Link>
      </section>
    </main>
  );
}
