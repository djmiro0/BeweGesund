"use client";

import { useLocale, useTranslations } from "next-intl";
import type { GamificationData } from "../settingsData";
import { SettingsSection } from "./SettingsControls";
import styles from "../Settings.module.css";

interface GamificationSummaryProps {
  data: GamificationData;
}

export default function GamificationSummary({ data }: GamificationSummaryProps) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const stats = [
    { label: t("gamification.xp"), value: data.xpPoints.toLocaleString(locale) },
    { label: t("gamification.level"), value: data.currentLevel },
    { label: t("gamification.streak"), value: t("gamification.days", { count: data.currentStreak }) },
    { label: t("gamification.weeklyRank"), value: data.weeklyRank ? `#${data.weeklyRank}` : "-" },
    { label: t("gamification.monthlyRank"), value: data.monthlyRank ? `#${data.monthlyRank}` : "-" },
  ];

  return (
    <SettingsSection
      title={t("sections.gamification.title")}
      description={t("sections.gamification.description")}
      testId="settings-gamification-section"
    >
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statTile}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.placeholderGrid}>
        <div className={styles.placeholderBox} data-testid="settings-badges-placeholder">
          <span>{t("gamification.badges")}</span>
          <p>{data.badges.length ? data.badges.join(" / ") : t("gamification.noBadges")}</p>
        </div>
        <div className={styles.placeholderBox} data-testid="settings-achievements-placeholder">
          <span>{t("gamification.achievements")}</span>
          <p>{data.achievements.length ? data.achievements.join(" / ") : t("gamification.noAchievements")}</p>
        </div>
      </div>
    </SettingsSection>
  );
}
