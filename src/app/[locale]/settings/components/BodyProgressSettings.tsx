import type { BodyProgressData } from "../settingsData";
import { SettingsInput, SettingsSection } from "./SettingsControls";
import styles from "../Settings.module.css";

interface BodyProgressSettingsProps {
  data: BodyProgressData;
  onChange: (data: BodyProgressData) => void;
}

export default function BodyProgressSettings({ data, onChange }: BodyProgressSettingsProps) {
  const update = <Key extends keyof BodyProgressData>(key: Key, value: BodyProgressData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title="Body & Progress"
      description="Targets used for progress tracking and daily health goals."
      testId="settings-body-section"
    >
      <div className={styles.fieldGrid}>
        <SettingsInput id="currentWeight" label="Current weight" type="number" suffix="kg" value={data.currentWeight} onChange={(value) => update("currentWeight", Number(value))} />
        <SettingsInput id="targetWeight" label="Target weight" type="number" suffix="kg" value={data.targetWeight} onChange={(value) => update("targetWeight", Number(value))} />
        <SettingsInput id="bodyFatPercentage" label="Body fat percentage" type="number" suffix="%" value={data.bodyFatPercentage} onChange={(value) => update("bodyFatPercentage", Number(value))} />
        <SettingsInput id="stepGoal" label="Step goal" type="number" value={data.stepGoal} onChange={(value) => update("stepGoal", Number(value))} />
        <SettingsInput id="waterIntakeGoal" label="Water intake goal" type="number" suffix="L" value={data.waterIntakeGoal} onChange={(value) => update("waterIntakeGoal", Number(value))} />
        <SettingsInput id="sleepGoal" label="Sleep goal" type="number" suffix="hours" value={data.sleepGoal} onChange={(value) => update("sleepGoal", Number(value))} />
      </div>
    </SettingsSection>
  );
}
