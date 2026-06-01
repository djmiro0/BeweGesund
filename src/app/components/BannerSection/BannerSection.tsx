"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./BannerSection.module.css";

export default function BannerSection() {
  const t = useTranslations("banners");

  const banners = [
    {
      id: 1,
      image: "/training.jpg",
      key: "training",
    },
    {
      id: 2,
      image: "/weights.jpg",
      key: "weights",
    },
    {
      id: 3,
      image: "/food.jpg",
      key: "food",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextBanner = () =>
    setCurrent((prev) => (prev + 1) % banners.length);
  const prevBanner = () =>
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  const activeBanner = banners[current];

  return (
    <section className={styles.bannerSection}>
      <div className={styles.sectionIntro}>
        <span>Bewegesund</span>
      </div>
      <div className={styles.bannerWrapper}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={styles.banner}
          >
            <Image
              src={activeBanner.image}
              alt={t(`${activeBanner.key}.title`)}
              fill
              className={styles.image}
              priority
            />
            <div className={styles.overlay}>
              <motion.div
                className={styles.textBox}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2>{t(`${activeBanner.key}.title`)}</h2>
                <p>{t(`${activeBanner.key}.subtitle`)}</p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={prevBanner}
          aria-label="Previous banner"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={nextBanner}
          aria-label="Next banner"
        >
          <ChevronRight size={24} />
        </button>
        <div className={styles.dots} aria-hidden="true">
          {banners.map((banner, index) => (
            <span
              key={banner.id}
              className={`${styles.dot} ${index === current ? styles.dotActive : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
