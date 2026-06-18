"use client";

import { useTranslations } from "next-intl";
import type { Equipment, FitnessLevel, TrainingLocation, WorkoutPreferencesData } from "../settingsData";
import { workoutDays } from "../settingsData";
import { SettingsInput, SettingsSection, SettingsSelect } from "./SettingsControls";
import styles from "../Settings.module.css";

interface WorkoutPreferencesProps {
  data: WorkoutPreferencesData;
  onChange: (data: WorkoutPreferencesData) => void;
}

export default function WorkoutPreferences({ data, onChange }: WorkoutPreferencesProps) {
  const t = useTranslations("settings");
  const trainingLocationOptions: Array<{ value: TrainingLocation; label: string }> = [
    { value: "gym", label: t("options.location.gym") },
    { value: "home", label: t("options.location.home") },
    { value: "outdoor", label: t("options.location.outdoor") },
  ];
  const equipmentOptions: Array<{ value: Equipment; label: string }> = [
    { value: "no-equipment", label: t("options.equipment.none") },
    { value: "dumbbells", label: t("options.equipment.dumbbells") },
    { value: "full-gym", label: t("options.equipment.fullGym") },
  ];
  const difficultyOptions: Array<{ value: FitnessLevel; label: string }> = [
    { value: "beginner", label: t("options.fitness.beginner") },
    { value: "intermediate", label: t("options.fitness.intermediate") },
    { value: "advanced", label: t("options.fitness.advanced") },
  ];
  const update = <Key extends keyof WorkoutPreferencesData>(key: Key, value: WorkoutPreferencesData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  const toggleDay = (day: string) => {
    const selectedDays = data.preferredWorkoutDays.includes(day)
      ? data.preferredWorkoutDays.filter((item) => item !== day)
      : [...data.preferredWorkoutDays, day];

    update("preferredWorkoutDays", selectedDays);
  };

  return (
    <SettingsSection
      title={t("sections.workout.title")}
      description={t("sections.workout.description")}
      testId="settings-workout-section"
    >
      <div className={styles.daysGroup} data-testid="settings-workout-days">
        <span className={styles.groupLabel}>{t("fields.preferredDays")}</span>
        <div className={styles.dayOptions}>
          {workoutDays.map((day) => (
            <label key={day} className={styles.dayOption}>
              <input
                type="checkbox"
                checked={data.preferredWorkoutDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              <span>{t(`days.${day.toLowerCase()}`)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <SettingsInput id="workoutDuration" label={t("fields.workoutDuration")} type="number" suffix="min" value={data.workoutDuration} onChange={(value) => update("workoutDuration", Number(value))} />
        <SettingsSelect id="trainingLocation" label={t("fields.trainingLocation")} value={data.trainingLocation} options={trainingLocationOptions} onChange={(value) => update("trainingLocation", value as TrainingLocation)} />
        <SettingsSelect id="equipment" label={t("fields.equipment")} value={data.equipment} options={equipmentOptions} onChange={(value) => update("equipment", value as Equipment)} />
        <SettingsSelect id="difficultyLevel" label={t("fields.difficulty")} value={data.difficultyLevel} options={difficultyOptions} onChange={(value) => update("difficultyLevel", value as FitnessLevel)} />
        <SettingsInput id="restTimerDuration" label={t("fields.restTimer")} type="number" suffix={t("units.seconds")} value={data.restTimerDuration} onChange={(value) => update("restTimerDuration", Number(value))} />
      </div>
    </SettingsSection>
  );
}
