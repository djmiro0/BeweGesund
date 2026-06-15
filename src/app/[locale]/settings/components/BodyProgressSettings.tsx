"use client";

import { useTranslations } from "next-intl";
import type { BodyProgressData } from "../settingsData";
import { SettingsInput, SettingsSection } from "./SettingsControls";
import styles from "../Settings.module.css";
import {
  kilogramsToPounds,
  poundsToKilograms,
  roundMeasurement,
  type UnitSystem,
} from "@/lib/appPreferences";

interface BodyProgressSettingsProps {
  data: BodyProgressData;
  onChange: (data: BodyProgressData) => void;
  unitSystem: UnitSystem;
}

export default function BodyProgressSettings({ data, onChange, unitSystem }: BodyProgressSettingsProps) {
  const t = useTranslations("settings");
  const isImperial = unitSystem === "imperial";
  const update = <Key extends keyof BodyProgressData>(key: Key, value: BodyProgressData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title={t("sections.body.title")}
      description={t("sections.body.description")}
      testId="settings-body-section"
    >
      <div className={styles.fieldGrid}>
        <SettingsInput
          id="currentWeight"
          label={t("fields.currentWeight")}
          type="number"
          suffix={isImperial ? "lb" : "kg"}
          value={isImperial ? roundMeasurement(kilogramsToPounds(data.currentWeight)) : data.currentWeight}
          onChange={(value) => update("currentWeight", isImperial
            ? roundMeasurement(poundsToKilograms(Number(value)))
            : Number(value))}
        />
        <SettingsInput
          id="targetWeight"
          label={t("fields.targetWeight")}
          type="number"
          suffix={isImperial ? "lb" : "kg"}
          value={isImperial ? roundMeasurement(kilogramsToPounds(data.targetWeight)) : data.targetWeight}
          onChange={(value) => update("targetWeight", isImperial
            ? roundMeasurement(poundsToKilograms(Number(value)))
            : Number(value))}
        />
        <SettingsInput id="bodyFatPercentage" label={t("fields.bodyFat")} type="number" suffix="%" value={data.bodyFatPercentage} onChange={(value) => update("bodyFatPercentage", Number(value))} />
        <SettingsInput id="stepGoal" label={t("fields.stepGoal")} type="number" value={data.stepGoal} onChange={(value) => update("stepGoal", Number(value))} />
        <SettingsInput id="waterIntakeGoal" label={t("fields.waterGoal")} type="number" suffix="L" value={data.waterIntakeGoal} onChange={(value) => update("waterIntakeGoal", Number(value))} />
        <SettingsInput id="sleepGoal" label={t("fields.sleepGoal")} type="number" suffix={t("units.hours")} value={data.sleepGoal} onChange={(value) => update("sleepGoal", Number(value))} />
      </div>
    </SettingsSection>
  );
}
