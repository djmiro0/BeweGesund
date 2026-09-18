"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import styles from "./LaunchPreview.module.css";

interface LaunchPreviewProps {
  openAuth: () => void;
}

interface PreviewPillar {
  title: string;
  description: string;
  imageAlt: string;
}

interface PreviewFaq {
  question: string;
  answer: string;
}

const pillarImages = [
  "/training.jpg",
  "/launch/home-posture.png",
  "/food.jpg",
  "/launch/mindful-recovery.png",
  "/launch/corporate-fitness.jpg",
  "/launch/health-workshop.jpg",
] as const;

const reveal: Variants = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LaunchPreview({ openAuth }: LaunchPreviewProps) {
  const t = useTranslations("launchPreview");
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroMediaY = useTransform(heroProgress, [0, 1], [0, 90]);
  const heroMediaScale = useTransform(heroProgress, [0, 1], [1.01, 1.06]);
  const prefersReducedMotion = useReducedMotion();
  const pillars = t.raw("offer.pillars") as PreviewPillar[];
  const faqItems = t.raw("faq.items") as PreviewFaq[];

  return (
    <main className={styles.preview}>
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroLogo} aria-hidden="true">
          <Image src="/logo.png" alt="" fill sizes="70vw" loading="eager" />
        </div>
        <motion.div
          className={styles.heroMedia}
          style={
            prefersReducedMotion
              ? undefined
              : {
                  y: heroMediaY,
                  scale: heroMediaScale,
                }
          }
          aria-hidden="true"
        >
          <video
            className={styles.heroVideo}
            autoPlay={!prefersReducedMotion}
            loop
            muted
            playsInline
            preload="metadata"
            poster="/launch/hero-training-poster.jpg"
          >
            <source src="/launch/hero-training.mp4" type="video/mp4" />
          </video>
        </motion.div>
        <div className={styles.heroGrain} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />

        <motion.div
          className={styles.heroContent}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.div className={styles.launchStatus} variants={reveal}>
            <span className={styles.statusDot} aria-hidden="true" />
            {t("status")}
          </motion.div>
          <motion.p className={styles.brandName} variants={reveal}>
            BeweGesund
          </motion.p>
          <motion.h1 variants={reveal}>{t("hero.title")}</motion.h1>
          <motion.p className={styles.heroDescription} variants={reveal}>
            {t("hero.description")}
          </motion.p>
          <motion.div className={styles.heroActions} variants={reveal}>
            <a href="#preview" className={styles.primaryAction}>
              {t("hero.explore")}
              <ArrowDown size={17} />
            </a>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={openAuth}
            >
              {t("hero.login")}
              <ArrowRight size={17} />
            </button>
          </motion.div>
        </motion.div>
      </section>

      <section
        id="preview"
        className={styles.pillars}
        aria-labelledby="preview-pillars"
      >
        <div className={styles.pillarsHeading}>
          <p className={styles.eyebrow}>{t("offer.eyebrow")}</p>
          <h2 id="preview-pillars">{t("offer.title")}</h2>
        </div>

        <motion.div
          className={styles.pillarList}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.11 } },
          }}
        >
          {pillars.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              className={styles.pillar}
              variants={reveal}
              whileHover={{ y: -8 }}
            >
              <Image
                src={pillarImages[index]}
                alt={pillar.imageAlt}
                fill
                sizes="(max-width: 620px) 82vw, 25vw"
                className={styles.pillarImage}
              />
              <div className={styles.pillarShade} aria-hidden="true" />
              <span className={styles.pillarIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className={styles.pillarCopy}>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </div>
              <span className={styles.lockedLabel}>
                <LockKeyhole size={14} />
                {t("offer.locked")}
              </span>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className={styles.experience}>
        <motion.div
          className={styles.experienceMedia}
          initial={{ clipPath: "inset(10% 0 10% 0)" }}
          whileInView={{ clipPath: "inset(0% 0 0% 0)" }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/launch/mobility-coaching.png"
            alt={t("experience.imageAlt")}
            fill
            sizes="(max-width: 800px) 100vw, 60vw"
            className={styles.experienceImage}
          />
        </motion.div>
        <motion.div
          className={styles.experienceCopy}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={reveal}
        >
          <p className={styles.eyebrow}>{t("experience.eyebrow")}</p>
          <h2>{t("experience.title")}</h2>
          <p>{t("experience.description")}</p>
          <span className={styles.launchLine}>
            <Sparkles size={17} />
            {t("experience.status")}
          </span>
        </motion.div>
      </section>

      <section className={styles.faq} aria-labelledby="launch-faq-title">
        <div className={styles.faqInner}>
          <motion.div
            className={styles.faqIntro}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            variants={reveal}
          >
            <p className={styles.eyebrow}>{t("faq.eyebrow")}</p>
            <h2 id="launch-faq-title">{t("faq.title")}</h2>
          </motion.div>

          <motion.div
            className={styles.faqList}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {faqItems.map((item, index) => (
              <motion.details
                key={item.question}
                className={styles.faqItem}
                variants={reveal}
              >
                <summary>
                  <span className={styles.faqIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.faqQuestion}>{item.question}</span>
                  <ChevronDown className={styles.faqChevron} size={21} />
                </summary>
                <div className={styles.faqAnswer}>
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={reveal}
        >
          <p className={styles.eyebrow}>{t("final.eyebrow")}</p>
          <h2>{t("final.title")}</h2>
          <p>{t("final.description")}</p>
          <button type="button" onClick={openAuth}>
            {t("final.login")}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>
    </main>
  );
}
