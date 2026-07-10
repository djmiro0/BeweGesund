"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { FitnessLevel, Gender, MainGoal, ProfileSettingsData } from "../settingsData";
import { SettingsInput, SettingsSection, SettingsSelect } from "./SettingsControls";
import styles from "../Settings.module.css";
import {
  centimetersToInches,
  inchesToCentimeters,
  kilogramsToPounds,
  poundsToKilograms,
  roundMeasurement,
  type UnitSystem,
} from "@/lib/appPreferences";

interface ProfileSettingsProps {
  data: ProfileSettingsData;
  onChange: (data: ProfileSettingsData) => void;
  onPhotoSelect: (file: File) => void;
  isUploadingPhoto: boolean;
  unitSystem: UnitSystem;
}

export default function ProfileSettings({
  data,
  onChange,
  onPhotoSelect,
  isUploadingPhoto,
  unitSystem,
}: ProfileSettingsProps) {
  const t = useTranslations("settings");
  const [loadedProfileImageUrl, setLoadedProfileImageUrl] = useState("");
  const isImperial = unitSystem === "imperial";
  const isProfileImageLoaded = Boolean(data.profileImageUrl && loadedProfileImageUrl === data.profileImageUrl);
  const genderOptions: Array<{ value: Gender | ""; label: string }> = [
    { value: "", label: t("options.gender.select") },
    { value: "female", label: t("options.gender.female") },
    { value: "male", label: t("options.gender.male") },
  ];
  const fitnessLevelOptions: Array<{ value: FitnessLevel; label: string }> = [
    { value: "beginner", label: t("options.fitness.beginner") },
    { value: "intermediate", label: t("options.fitness.intermediate") },
    { value: "advanced", label: t("options.fitness.advanced") },
  ];
  const mainGoalOptions: Array<{ value: MainGoal; label: string }> = [
    { value: "lose-weight", label: t("options.goals.loseWeight") },
    { value: "build-muscle", label: t("options.goals.buildMuscle") },
    { value: "improve-fitness", label: t("options.goals.improveFitness") },
    { value: "stay-healthy", label: t("options.goals.stayHealthy") },
    { value: "backPain", label: t("options.goals.backPain") },
  ];
  const update = <Key extends keyof ProfileSettingsData>(key: Key, value: ProfileSettingsData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  useEffect(() => {
    if (!data.profileImageUrl) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setLoadedProfileImageUrl(data.profileImageUrl);
    };
    image.onerror = () => {
      if (!cancelled) setLoadedProfileImageUrl("");
    };
    image.src = data.profileImageUrl;

    return () => {
      cancelled = true;
    };
  }, [data.profileImageUrl]);

  return (
    <SettingsSection
      title={t("sections.profile.title")}
      description={t("sections.profile.description")}
      testId="settings-profile-section"
    >
      <div className={styles.profileBlock}>
        <label className={styles.avatarUpload}>
          <div
            className={`${styles.avatarPlaceholder} ${data.profileImageUrl && !isProfileImageLoaded ? styles.avatarPlaceholderLoading : ""}`}
            data-testid="settings-profile-image"
            style={data.profileImageUrl && isProfileImageLoaded ? { backgroundImage: `url("${data.profileImageUrl}")` } : undefined}
          >
            {data.profileImageUrl && !isProfileImageLoaded ? (
              <span className={styles.avatarSpinner} aria-label={t("sections.profile.loadingPhoto")} />
            ) : data.profileImageUrl ? null : (
              <span>{data.fullName.charAt(0)}</span>
            )}
          </div>
          <input
            type="file"
            aria-label={t("sections.profile.changePhoto")}
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploadingPhoto}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onPhotoSelect(file);
              event.target.value = "";
            }}
          />
          <span>{isUploadingPhoto ? t("sections.profile.uploading") : t("sections.profile.changePhoto")}</span>
        </label>
        <div>
          <p className={styles.profileName}>{data.fullName}</p>
          <p className={styles.profileHint}>{t("sections.profile.photoHint")}</p>
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <SettingsInput id="fullName" label={t("fields.fullName")} value={data.fullName} onChange={(value) => update("fullName", value)} />
        <SettingsInput id="username" label={t("fields.username")} value={data.username} onChange={(value) => update("username", value)} />
        <SettingsInput id="email" label={t("fields.email")} type="email" value={data.email} readOnly disabled onChange={() => undefined} />
        <SettingsInput id="age" label={t("fields.age")} type="number" min={1} max={120} value={data.age} onChange={(value) => update("age", Number(value))} />
        <SettingsSelect id="gender" label={t("fields.gender")} value={data.gender} options={genderOptions} disabled onChange={() => undefined} />
        <SettingsInput
          id="height"
          label={t("fields.height")}
          type="number"
          min={isImperial ? 31 : 80}
          max={isImperial ? 95 : 240}
          suffix={isImperial ? "in" : "cm"}
          value={isImperial ? roundMeasurement(centimetersToInches(data.height)) : data.height}
          onChange={(value) => update("height", isImperial
            ? roundMeasurement(inchesToCentimeters(Number(value)))
            : Number(value))}
        />
        <SettingsInput
          id="weight"
          label={t("fields.weight")}
          type="number"
          min={isImperial ? 55 : 25}
          max={isImperial ? 661 : 300}
          suffix={isImperial ? "lb" : "kg"}
          value={isImperial ? roundMeasurement(kilogramsToPounds(data.weight)) : data.weight}
          onChange={(value) => update("weight", isImperial
            ? roundMeasurement(poundsToKilograms(Number(value)))
            : Number(value))}
        />
        <SettingsSelect id="fitnessLevel" label={t("fields.fitnessLevel")} value={data.fitnessLevel} options={fitnessLevelOptions} onChange={(value) => update("fitnessLevel", value as FitnessLevel)} />
        <SettingsSelect id="mainGoal" label={t("fields.mainGoal")} value={data.mainGoal} options={mainGoalOptions} onChange={(value) => update("mainGoal", value as MainGoal)} />
      </div>
    </SettingsSection>
  );
}
