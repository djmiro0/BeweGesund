import type { AppLanguage, AppSettingsData, AppTheme, UnitSystem } from "../settingsData";
import { SettingsSection, SettingsSelect, SettingsToggle } from "./SettingsControls";
import styles from "../Settings.module.css";

interface AppSettingsProps {
  data: AppSettingsData;
  onChange: (data: AppSettingsData) => void;
}

const languageOptions: Array<{ value: AppLanguage; label: string }> = [
  { value: "english", label: "English" },
  { value: "german", label: "German" },
  { value: "serbian", label: "Serbian" },
];

const themeOptions: Array<{ value: AppTheme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const unitOptions: Array<{ value: UnitSystem; label: string }> = [
  { value: "metric", label: "kg / cm" },
  { value: "imperial", label: "lbs / ft" },
];

export default function AppSettings({ data, onChange }: AppSettingsProps) {
  const update = <Key extends keyof AppSettingsData>(key: Key, value: AppSettingsData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title="App Settings"
      description="Local display and playback preferences."
      testId="settings-app-section"
    >
      <div className={styles.fieldGrid}>
        <SettingsSelect id="language" label="Language" value={data.language} options={languageOptions} onChange={(value) => update("language", value as AppLanguage)} />
        <SettingsSelect id="theme" label="Theme" value={data.theme} options={themeOptions} onChange={(value) => update("theme", value as AppTheme)} />
        <SettingsSelect id="units" label="Units" value={data.units} options={unitOptions} onChange={(value) => update("units", value as UnitSystem)} />
      </div>
      <div className={styles.toggleList}>
        <SettingsToggle
          id="videoAutoplay"
          label="Video autoplay"
          checked={data.videoAutoplay}
          onChange={(checked) => update("videoAutoplay", checked)}
        />
      </div>
    </SettingsSection>
  );
}
