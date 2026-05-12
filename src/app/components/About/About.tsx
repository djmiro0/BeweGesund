"use client";
import { useTranslations } from "next-intl";
import styles from "./About.module.css";
import { Dumbbell, BarChart3, Users, HeartPulse } from "lucide-react";

export const About: React.FC = () => {
  const t = useTranslations("about");

  const features = [
    { icon: <Dumbbell size={22} />, text: t("features.training") },
    { icon: <BarChart3 size={22} />, text: t("features.tracking") },
    { icon: <Users size={22} />, text: t("features.community") },
    { icon: <HeartPulse size={22} />, text: t("features.wellness") },
  ];

  return (
    <div className={styles.aboutShell}>
      <div className={styles.glow} />
      <div className={styles.aboutContainer}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>S.BeweGesund</p>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </header>

        <div className={styles.storyGrid}>
          <section className={styles.storyPanel}>
            <p className={styles.panelLabel}>{t("missionTitle")}</p>
            <p className={styles.text}>{t("missionText")}</p>
          </section>

          <section className={styles.storyPanel}>
            <p className={styles.panelLabel}>{t("visionTitle")}</p>
            <p className={styles.text}>{t("visionText")}</p>
          </section>
        </div>

        <section className={styles.offerSection}>
          <div className={styles.offerIntro}>
            <p className={styles.panelLabel}>{t("offerTitle")}</p>
          </div>
          <ul className={styles.list}>
            {features.map((item, i) => (
              <li key={i} className={styles.listItem}>
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.featureText}>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className={styles.footerNote}>{t("footer")}</p>
      </div>
    </div>
  );
};
