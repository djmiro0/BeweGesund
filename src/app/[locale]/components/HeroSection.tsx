"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./HeroSection.module.css";

export default function HeroSection({ openAuth }: { openAuth?: () => void }) {
    const t = useTranslations("home.hero");

    return (
        <section className={styles.hero}>
            <div className={styles.mediaLayer} aria-hidden="true">
                <Image
                    src="/training.jpg"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className={styles.heroImage}
                />
            </div>
            <div className={styles.scrim} aria-hidden="true" />
            <motion.div
                className={styles.content}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
                <motion.div
                    className={styles.brandMark}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                >
                    <Sparkles size={16} />
                    S.BeweGesund
                </motion.div>
                <h1>{t("title")}</h1>
                <p>{t("subtitle")}</p>
                <motion.button
                    type="button"
                    onClick={openAuth}
                    className={styles.cta}
                    whileHover={{ y: -3, scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span>{t("cta")}</span>
                    <ArrowRight size={18} />
                </motion.button>
            </motion.div>
        </section>
    );
}
