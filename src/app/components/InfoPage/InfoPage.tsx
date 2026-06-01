"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
      <motion.div
        className={styles.pageInner}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
      >
        <motion.header
          className={styles.hero}
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
        >
          <p className={styles.eyebrow}>Bewegesund</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.intro}>{intro}</p>
          {ctaLabel && ctaHref ? (
            <Link href={`/${locale}${ctaHref}`} className={styles.cta}>
              {ctaLabel}
            </Link>
          ) : null}
        </motion.header>

        <motion.div
          className={styles.sectionGrid}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {sections.map((section) => (
            <motion.article
              key={section.title}
              className={styles.card}
              variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }}
            >
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardBody}>{section.body}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className={styles.noteBlock}
          variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }}
        >
          <p>{note}</p>
        </motion.div>
      </motion.div>
    </section>
  );
}
