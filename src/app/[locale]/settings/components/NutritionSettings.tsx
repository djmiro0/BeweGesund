"use client";

import { useTranslations } from "next-intl";
import type { DietPreference, NutritionSettingsData } from "../settingsData";
import {
  SettingsInput,
  SettingsSection,
  SettingsSelect,
} from "./SettingsControls";
import styles from "../Settings.module.css";

interface NutritionSettingsProps {
  data: NutritionSettingsData;
  onChange: (data: NutritionSettingsData) => void;
}

export default function NutritionSettings({
  data,
  onChange,
}: NutritionSettingsProps) {
  const t = useTranslations("settings");
  const dietOptions: Array<{ value: DietPreference; label: string }> = [
    { value: "normal", label: t("options.diet.normal") },
    { value: "vegetarian", label: t("options.diet.vegetarian") },
    { value: "vegan", label: t("options.diet.vegan") },
    { value: "keto", label: t("options.diet.keto") },
  ];
  const update = <Key extends keyof NutritionSettingsData>(
    key: Key,
    value: NutritionSettingsData[Key],
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title={t("sections.nutrition.title")}
      description={t("sections.nutrition.description")}
      testId="settings-nutrition-section"
    >
      <div className={styles.fieldGrid}>
        <SettingsInput
          id="dailyCalorieGoal"
          label={t("fields.calorieGoal")}
          type="number"
          suffix="kcal"
          value={data.dailyCalorieGoal}
          onChange={(value) => update("dailyCalorieGoal", Number(value))}
        />
        <SettingsInput
          id="proteinGoal"
          label={t("fields.proteinGoal")}
          type="number"
          suffix="g"
          value={data.proteinGoal}
          onChange={(value) => update("proteinGoal", Number(value))}
        />
        <SettingsInput
          id="carbsGoal"
          label={t("fields.carbsGoal")}
          type="number"
          suffix="g"
          value={data.carbsGoal}
          onChange={(value) => update("carbsGoal", Number(value))}
        />
        <SettingsInput
          id="fatGoal"
          label={t("fields.fatGoal")}
          type="number"
          suffix="g"
          value={data.fatGoal}
          onChange={(value) => update("fatGoal", Number(value))}
        />
        <SettingsSelect
          id="dietPreference"
          label={t("fields.dietPreference")}
          value={data.dietPreference}
          options={dietOptions}
          onChange={(value) =>
            update("dietPreference", value as DietPreference)
          }
        />
        <SettingsInput
          id="allergies"
          label={t("fields.allergies")}
          value={data.allergies}
          onChange={(value) => update("allergies", value)}
        />
      </div>
    </SettingsSection>
  );
}
