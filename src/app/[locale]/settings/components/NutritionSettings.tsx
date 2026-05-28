import type { DietPreference, NutritionSettingsData } from "../settingsData";
import { SettingsInput, SettingsSection, SettingsSelect } from "./SettingsControls";
import styles from "../Settings.module.css";

interface NutritionSettingsProps {
  data: NutritionSettingsData;
  onChange: (data: NutritionSettingsData) => void;
}

const dietOptions: Array<{ value: DietPreference; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
];

export default function NutritionSettings({ data, onChange }: NutritionSettingsProps) {
  const update = <Key extends keyof NutritionSettingsData>(key: Key, value: NutritionSettingsData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title="Nutrition Settings"
      description="Macro and diet targets for meal recommendations later."
      testId="settings-nutrition-section"
    >
      <div className={styles.fieldGrid}>
        <SettingsInput id="dailyCalorieGoal" label="Daily calorie goal" type="number" suffix="kcal" value={data.dailyCalorieGoal} onChange={(value) => update("dailyCalorieGoal", Number(value))} />
        <SettingsInput id="proteinGoal" label="Protein goal" type="number" suffix="g" value={data.proteinGoal} onChange={(value) => update("proteinGoal", Number(value))} />
        <SettingsInput id="carbsGoal" label="Carbs goal" type="number" suffix="g" value={data.carbsGoal} onChange={(value) => update("carbsGoal", Number(value))} />
        <SettingsInput id="fatGoal" label="Fat goal" type="number" suffix="g" value={data.fatGoal} onChange={(value) => update("fatGoal", Number(value))} />
        <SettingsSelect id="dietPreference" label="Diet preference" value={data.dietPreference} options={dietOptions} onChange={(value) => update("dietPreference", value as DietPreference)} />
        <SettingsInput id="allergies" label="Allergies" value={data.allergies} onChange={(value) => update("allergies", value)} />
      </div>
    </SettingsSection>
  );
}
