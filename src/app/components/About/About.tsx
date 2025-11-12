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
    <div className={styles.aboutContainer}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.subtitle}>{t("subtitle")}</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("missionTitle")}</h2>
        <p className={styles.text}>{t("missionText")}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("offerTitle")}</h2>
        <ul className={styles.list}>
          {features.map((item, i) => (
            <li key={i} className={styles.listItem}>
              <span className={styles.icon}>{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("visionTitle")}</h2>
        <p className={styles.text}>{t("visionText")}</p>
      </section>
    </div>
  );
};
