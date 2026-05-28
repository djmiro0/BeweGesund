import type { Equipment, FitnessLevel, TrainingLocation, WorkoutPreferencesData } from "../settingsData";
import { workoutDays } from "../settingsData";
import { SettingsInput, SettingsSection, SettingsSelect } from "./SettingsControls";
import styles from "../Settings.module.css";

interface WorkoutPreferencesProps {
  data: WorkoutPreferencesData;
  onChange: (data: WorkoutPreferencesData) => void;
}

const trainingLocationOptions: Array<{ value: TrainingLocation; label: string }> = [
  { value: "gym", label: "Gym" },
  { value: "home", label: "Home" },
  { value: "outdoor", label: "Outdoor" },
];

const equipmentOptions: Array<{ value: Equipment; label: string }> = [
  { value: "no-equipment", label: "No equipment" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "full-gym", label: "Full gym" },
];

const difficultyOptions: Array<{ value: FitnessLevel; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function WorkoutPreferences({ data, onChange }: WorkoutPreferencesProps) {
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
      title="Workout Preferences"
      description="How and where workouts should be planned."
      testId="settings-workout-section"
    >
      <div className={styles.daysGroup} data-testid="settings-workout-days">
        <span className={styles.groupLabel}>Preferred workout days</span>
        <div className={styles.dayOptions}>
          {workoutDays.map((day) => (
            <label key={day} className={styles.dayOption}>
              <input
                type="checkbox"
                checked={data.preferredWorkoutDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              <span>{day.slice(0, 3)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <SettingsInput id="workoutDuration" label="Workout duration" type="number" suffix="min" value={data.workoutDuration} onChange={(value) => update("workoutDuration", Number(value))} />
        <SettingsSelect id="trainingLocation" label="Training location" value={data.trainingLocation} options={trainingLocationOptions} onChange={(value) => update("trainingLocation", value as TrainingLocation)} />
        <SettingsSelect id="equipment" label="Equipment" value={data.equipment} options={equipmentOptions} onChange={(value) => update("equipment", value as Equipment)} />
        <SettingsSelect id="difficultyLevel" label="Difficulty level" value={data.difficultyLevel} options={difficultyOptions} onChange={(value) => update("difficultyLevel", value as FitnessLevel)} />
        <SettingsInput id="restTimerDuration" label="Rest timer duration" type="number" suffix="sec" value={data.restTimerDuration} onChange={(value) => update("restTimerDuration", Number(value))} />
      </div>
    </SettingsSection>
  );
}
