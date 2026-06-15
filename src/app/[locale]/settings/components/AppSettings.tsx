"use client";

import { useTranslations } from "next-intl";
import type { AppLanguage, AppSettingsData, AppTheme, UnitSystem } from "../settingsData";
import { SettingsSection, SettingsSelect, SettingsToggle } from "./SettingsControls";
import styles from "../Settings.module.css";
import PwaInstallAction from "./PwaInstallAction";

interface AppSettingsProps {
  data: AppSettingsData;
  onChange: (data: AppSettingsData) => void;
}

const unitOptions: Array<{ value: UnitSystem; label: string }> = [
  { value: "metric", label: "kg / cm" },
  { value: "imperial", label: "lbs / ft" },
];

export default function AppSettings({ data, onChange }: AppSettingsProps) {
  const t = useTranslations("settings");
  const languageOptions: Array<{ value: AppLanguage; label: string }> = [
    { value: "english", label: t("options.language.english") },
    { value: "german", label: t("options.language.german") },
  ];
  const themeOptions: Array<{ value: AppTheme; label: string }> = [
    { value: "light", label: t("options.theme.light") },
    { value: "dark", label: t("options.theme.dark") },
    { value: "system", label: t("options.theme.system") },
  ];
  const update = <Key extends keyof AppSettingsData>(key: Key, value: AppSettingsData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title={t("sections.app.title")}
      description={t("sections.app.description")}
      testId="settings-app-section"
    >
      <div className={styles.fieldGrid}>
        <SettingsSelect id="language" label={t("fields.language")} value={data.language} options={languageOptions} onChange={(value) => update("language", value as AppLanguage)} />
        <SettingsSelect id="theme" label={t("fields.theme")} value={data.theme} options={themeOptions} onChange={(value) => update("theme", value as AppTheme)} />
        <SettingsSelect id="units" label={t("fields.units")} value={data.units} options={unitOptions} onChange={(value) => update("units", value as UnitSystem)} />
      </div>
      <div className={styles.toggleList}>
        <SettingsToggle
          id="videoAutoplay"
          label={t("fields.videoAutoplay")}
          checked={data.videoAutoplay}
          onChange={(checked) => update("videoAutoplay", checked)}
        />
      </div>
      <PwaInstallAction />
    </SettingsSection>
  );
}
