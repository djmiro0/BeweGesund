"use client";

import { useState } from "react";
import AppSettings from "./components/AppSettings";
import BodyProgressSettings from "./components/BodyProgressSettings";
import GamificationSummary from "./components/GamificationSummary";
import NotificationSettings from "./components/NotificationSettings";
import NutritionSettings from "./components/NutritionSettings";
import PrivacySettings from "./components/PrivacySettings";
import ProfileSettings from "./components/ProfileSettings";
import WorkoutPreferences from "./components/WorkoutPreferences";
import { defaultUserSettings, type UserSettings } from "./settingsData";
import styles from "./Settings.module.css";

function cloneSettings(settings: UserSettings): UserSettings {
  return structuredClone(settings);
}

export default function SettingsPage() {
  const [savedSettings, setSavedSettings] = useState<UserSettings>(() => cloneSettings(defaultUserSettings));
  const [draftSettings, setDraftSettings] = useState<UserSettings>(() => cloneSettings(defaultUserSettings));
  const [successMessage, setSuccessMessage] = useState("");

  const updateSection = <Key extends keyof UserSettings>(key: Key, value: UserSettings[Key]) => {
    setDraftSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSuccessMessage("");
  };

  const handleSave = () => {
    setSavedSettings(cloneSettings(draftSettings));
    setSuccessMessage("Settings saved successfully.");
  };

  const handleReset = () => {
    setDraftSettings(cloneSettings(savedSettings));
    setSuccessMessage("");
  };

  return (
    <section className={styles.settingsPage} data-testid="settings-page">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Account settings</p>
            <h1>Settings</h1>
            <p>
              Manage profile, training, nutrition, privacy, and app preferences. These values are local mock settings
              for now and are ready for later Firebase integration.
            </p>
          </div>
        </header>

        <div className={styles.layout}>
          <ProfileSettings data={draftSettings.profile} onChange={(value) => updateSection("profile", value)} />
          <BodyProgressSettings data={draftSettings.bodyProgress} onChange={(value) => updateSection("bodyProgress", value)} />
          <WorkoutPreferences data={draftSettings.workoutPreferences} onChange={(value) => updateSection("workoutPreferences", value)} />
          <NutritionSettings data={draftSettings.nutrition} onChange={(value) => updateSection("nutrition", value)} />
          <GamificationSummary data={draftSettings.gamification} />
          <NotificationSettings data={draftSettings.notifications} onChange={(value) => updateSection("notifications", value)} />
          <PrivacySettings data={draftSettings.privacy} onChange={(value) => updateSection("privacy", value)} />
          <AppSettings data={draftSettings.app} onChange={(value) => updateSection("app", value)} />
        </div>

        <div className={styles.actionBar}>
          {successMessage ? (
            <p className={styles.successMessage} role="status" data-testid="settings-success-message">
              {successMessage}
            </p>
          ) : (
            <span />
          )}
          <div className={styles.actionButtons}>
            <button type="button" className={styles.resetButton} onClick={handleReset}>
              Cancel / Reset
            </button>
            <button type="button" className={styles.saveButton} onClick={handleSave} data-testid="settings-save-button">
              Save settings
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
