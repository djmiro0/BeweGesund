"use client";

import Image from "next/image";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import styles from "./ComingSoon.module.css";

interface ComingSoonProps {
  openAuth: () => void;
}

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ComingSoon({ openAuth }: ComingSoonProps) {
  const t = useTranslations("comingSoon");

  return (
    <main className={styles.comingSoon}>
      <div className={styles.backgroundMedia} aria-hidden="true">
        <Image
          src="/bewegesund-background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.backgroundImage}
        />
      </div>
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
            <button
              type="button"
              className={styles.primaryButton}
              onClick={openAuth}
            >
              {t("login")}
              <ArrowRight size={16} />
            </button>
            <span className={styles.statusPill}>
              <Sparkles size={15} />
              {t("phase")}
            </span>
          </motion.div>
        </div>

        <motion.div className={styles.statusRail} variants={fadeIn}>
          <div className={styles.statusItem}>
            <CircleCheck size={18} />
            <span>{t("status.concept")}</span>
          </div>
          <div className={styles.statusItem}>
            <Clock3 size={18} />
            <span>{t("status.content")}</span>
          </div>
          <div className={styles.statusItem}>
            <LockKeyhole size={18} />
            <span>{t("status.access")}</span>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
