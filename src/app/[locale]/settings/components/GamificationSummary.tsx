import type { GamificationData } from "../settingsData";
import { SettingsSection } from "./SettingsControls";
import styles from "../Settings.module.css";

interface GamificationSummaryProps {
  data: GamificationData;
}

export default function GamificationSummary({ data }: GamificationSummaryProps) {
  const stats = [
    { label: "XP points", value: data.xpPoints.toLocaleString() },
    { label: "Current level", value: data.currentLevel },
    { label: "Current streak", value: `${data.currentStreak} days` },
    { label: "Weekly rank", value: data.weeklyRank ? `#${data.weeklyRank}` : "-" },
    { label: "Monthly rank", value: data.monthlyRank ? `#${data.monthlyRank}` : "-" },
  ];

  return (
    <SettingsSection
      title="Gamification"
      description="Progress rewards and ranking placeholders."
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
          <span>Badges placeholder</span>
          <p>{data.badges.length ? data.badges.join(" / ") : "No badges yet"}</p>
        </div>
        <div className={styles.placeholderBox} data-testid="settings-achievements-placeholder">
          <span>Achievements placeholder</span>
          <p>{data.achievements.length ? data.achievements.join(" / ") : "No achievements yet"}</p>
        </div>
      </div>
    </SettingsSection>
  );
}
