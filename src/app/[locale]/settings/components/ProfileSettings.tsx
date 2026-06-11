import type { FitnessLevel, Gender, MainGoal, ProfileSettingsData } from "../settingsData";
import { SettingsInput, SettingsSection, SettingsSelect } from "./SettingsControls";
import styles from "../Settings.module.css";

interface ProfileSettingsProps {
  data: ProfileSettingsData;
  onChange: (data: ProfileSettingsData) => void;
  onPhotoSelect: (file: File) => void;
  isUploadingPhoto: boolean;
}

const genderOptions: Array<{ value: Gender | ""; label: string }> = [
  { value: "", label: "Select gender" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const fitnessLevelOptions: Array<{ value: FitnessLevel; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const mainGoalOptions: Array<{ value: MainGoal; label: string }> = [
  { value: "lose-weight", label: "Lose weight" },
  { value: "build-muscle", label: "Build muscle" },
  { value: "improve-fitness", label: "Improve fitness" },
  { value: "stay-healthy", label: "Stay healthy" },
  { value: "backPain", label: "Reduce back pain" },
];

export default function ProfileSettings({
  data,
  onChange,
  onPhotoSelect,
  isUploadingPhoto,
}: ProfileSettingsProps) {
  const update = <Key extends keyof ProfileSettingsData>(key: Key, value: ProfileSettingsData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <SettingsSection
      title="Profile"
      description="Basic identity and training profile details."
      testId="settings-profile-section"
    >
      <div className={styles.profileBlock}>
        <label className={styles.avatarUpload}>
          <div
            className={styles.avatarPlaceholder}
            data-testid="settings-profile-image"
            style={data.profileImageUrl ? { backgroundImage: `url("${data.profileImageUrl}")` } : undefined}
          >
            {data.profileImageUrl ? null : <span>{data.fullName.charAt(0)}</span>}
          </div>
          <input
            type="file"
            aria-label="Change photo"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploadingPhoto}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onPhotoSelect(file);
              event.target.value = "";
            }}
          />
          <span>{isUploadingPhoto ? "Uploading..." : "Change photo"}</span>
        </label>
        <div>
          <p className={styles.profileName}>{data.fullName}</p>
          <p className={styles.profileHint}>JPG, PNG or WebP. Maximum 5 MB.</p>
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <SettingsInput id="fullName" label="Full name" value={data.fullName} onChange={(value) => update("fullName", value)} />
        <SettingsInput id="username" label="Username" value={data.username} onChange={(value) => update("username", value)} />
        <SettingsInput id="email" label="Email" type="email" value={data.email} readOnly onChange={() => undefined} />
        <SettingsInput id="age" label="Age" type="number" min={1} max={120} value={data.age} onChange={(value) => update("age", Number(value))} />
        <SettingsSelect id="gender" label="Gender" value={data.gender} options={genderOptions} onChange={(value) => update("gender", value as Gender | "")} />
        <SettingsInput id="height" label="Height" type="number" min={80} max={240} suffix="cm" value={data.height} onChange={(value) => update("height", Number(value))} />
        <SettingsInput id="weight" label="Weight" type="number" min={25} max={300} suffix="kg" value={data.weight} onChange={(value) => update("weight", Number(value))} />
        <SettingsSelect id="fitnessLevel" label="Fitness level" value={data.fitnessLevel} options={fitnessLevelOptions} onChange={(value) => update("fitnessLevel", value as FitnessLevel)} />
        <SettingsSelect id="mainGoal" label="Main goal" value={data.mainGoal} options={mainGoalOptions} onChange={(value) => update("mainGoal", value as MainGoal)} />
      </div>
    </SettingsSection>
  );
}
