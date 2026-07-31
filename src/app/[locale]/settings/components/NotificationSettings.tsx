"use client";

import { useTranslations } from "next-intl";
import type { NotificationSettingsData } from "../settingsData";
import { SettingsSection, SettingsToggle } from "./SettingsControls";
import styles from "../Settings.module.css";

interface NotificationSettingsProps {
  data: NotificationSettingsData;
  onChange: (data: NotificationSettingsData) => void;
}

export default function NotificationSettings({
  data,
  onChange,
}: NotificationSettingsProps) {
  const t = useTranslations("settings");
  const notificationFields: Array<{
    key: keyof NotificationSettingsData;
    label: string;
  }> = [
    { key: "workoutReminders", label: t("fields.workoutReminders") },
    { key: "mealReminders", label: t("fields.mealReminders") },
    { key: "waterReminders", label: t("fields.waterReminders") },
    { key: "challengeUpdates", label: t("fields.challengeUpdates") },
    { key: "leaderboardUpdates", label: t("fields.leaderboardUpdates") },
    { key: "emailNotifications", label: t("fields.emailNotifications") },
    { key: "pushNotifications", label: t("fields.pushNotifications") },
  ];
  const update = (key: keyof NotificationSettingsData, value: boolean) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title={t("sections.notifications.title")}
      description={t("sections.notifications.description")}
      testId="settings-notifications-section"
    >
      <div className={styles.toggleList}>
        {notificationFields.map((field) => (
          <SettingsToggle
            key={field.key}
            id={field.key}
            label={field.label}
            checked={data[field.key]}
            testId={`settings-toggle-${field.key}`}
            onChange={(checked) => update(field.key, checked)}
          />
        ))}
      </div>
    </SettingsSection>
  );
}
