"use client";

import Link from "next/link";
import { ArrowRight, Compass, Home, RotateCcw } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import styles from "./BadRequest.module.css";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function BadRequestPage() {
  const locale = useLocale();
  const t = useTranslations("badRequest");
  const items = t.raw("items") as string[];

  return (
    <div className={styles.page}>
      <motion.section
        className={styles.hero}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <div className={styles.heroMedia} aria-hidden="true">
          <motion.div
            className={styles.orbit}
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className={styles.pulseLine}
            animate={{ scaleX: [0.65, 1, 0.65], opacity: [0.48, 1, 0.48] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className={styles.heroCopy}>
          <motion.p className={styles.eyebrow} variants={fadeIn}>
            {t("eyebrow")}
          </motion.p>
          <motion.h1 className={styles.title} variants={fadeIn}>
            {t("title")}
          </motion.h1>
          <motion.p className={styles.description} variants={fadeIn}>
            {t("description")}
          </motion.p>
          <motion.div className={styles.actions} variants={fadeIn}>
            <Link href={`/${locale}`} className={styles.primaryButton}>
              {t("action")}
              <ArrowRight size={16} />
            </Link>
            <span className={styles.statusPill}>
              <Compass size={15} />
              {t("status")}
            </span>
          </motion.div>
        </div>

        <motion.div className={styles.statusRail} variants={fadeIn}>
          <div className={styles.statusItem}>
            <RotateCcw size={18} />
            <span>{items[0]}</span>
          </div>
          <div className={styles.statusItem}>
            <Home size={18} />
            <span>{items[1]}</span>
          </div>
          <div className={styles.statusItem}>
            <Compass size={18} />
            <span>{items[2]}</span>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
