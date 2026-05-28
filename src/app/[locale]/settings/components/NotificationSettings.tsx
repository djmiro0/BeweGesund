import type { NotificationSettingsData } from "../settingsData";
import { SettingsSection, SettingsToggle } from "./SettingsControls";
import styles from "../Settings.module.css";

interface NotificationSettingsProps {
  data: NotificationSettingsData;
  onChange: (data: NotificationSettingsData) => void;
}

const notificationFields: Array<{ key: keyof NotificationSettingsData; label: string }> = [
  { key: "workoutReminders", label: "Workout reminders" },
  { key: "mealReminders", label: "Meal reminders" },
  { key: "waterReminders", label: "Water reminders" },
  { key: "challengeUpdates", label: "Challenge updates" },
  { key: "leaderboardUpdates", label: "Leaderboard updates" },
  { key: "emailNotifications", label: "Email notifications" },
  { key: "pushNotifications", label: "Push notifications" },
];

export default function NotificationSettings({ data, onChange }: NotificationSettingsProps) {
  const update = (key: keyof NotificationSettingsData, value: boolean) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title="Notifications"
      description="Choose which reminders and updates should be active."
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
