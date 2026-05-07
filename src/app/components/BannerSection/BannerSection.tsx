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
      <div className={styles.bannerWrapper}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.8 }}
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
              <div className={styles.textBox}>
                <h2>{t(`${activeBanner.key}.title`)}</h2>
                <p>{t(`${activeBanner.key}.subtitle`)}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={prevBanner}
          aria-label="Previous banner"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={nextBanner}
          aria-label="Next banner"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </section>
  );
}
