"use client";

import { updateProfile } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { db } from "../../../../firebase.config";
import { useAuth } from "../components/AuthProvider";
import AppSettings from "./components/AppSettings";
import AccountManagement from "./components/AccountManagement";
import BodyProgressSettings from "./components/BodyProgressSettings";
import GamificationSummary from "./components/GamificationSummary";
import NotificationSettings from "./components/NotificationSettings";
import NutritionSettings from "./components/NutritionSettings";
import PrivacySettings from "./components/PrivacySettings";
import ProfileSettings from "./components/ProfileSettings";
import WorkoutPreferences from "./components/WorkoutPreferences";
import {
  defaultUserSettings,
  profileUpdateFromSettings,
  settingsFromFirebase,
  storedSettingsFromForm,
  type UserSettings,
} from "./settingsData";
import styles from "./Settings.module.css";

function cloneSettings(settings: UserSettings): UserSettings {
  return structuredClone(settings);
}

export default function SettingsPage() {
  const locale = useLocale();
  const { user, profile } = useAuth();
  const userId = user?.uid;
  const [savedSettings, setSavedSettings] = useState<UserSettings>(() => cloneSettings(defaultUserSettings));
  const [draftSettings, setDraftSettings] = useState<UserSettings>(() => cloneSettings(defaultUserSettings));
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [storedSettings, setStoredSettings] = useState<Record<string, unknown>>({});
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPreferencesLoaded(true);
      return;
    }

    setPreferencesLoaded(false);
    return onSnapshot(
      doc(db, "users", userId, "settings", "preferences"),
      (snapshot) => {
        setStoredSettings(snapshot.exists() ? snapshot.data() : {});
        setPreferencesLoaded(true);
      },
      () => {
        setErrorMessage("Settings could not be loaded from Firebase.");
        setPreferencesLoaded(true);
      },
    );
  }, [userId]);

  useEffect(() => {
    if (!user || !profile || !preferencesLoaded || isDirty) return;

    const nextSettings = settingsFromFirebase(profile, storedSettings, user, locale);
    setSavedSettings(cloneSettings(nextSettings));
    setDraftSettings(cloneSettings(nextSettings));
  }, [isDirty, locale, preferencesLoaded, profile, storedSettings, user]);

  const updateSection = <Key extends keyof UserSettings>(key: Key, value: UserSettings[Key]) => {
    setDraftSettings((current) => ({
      ...current,
      [key]: value,
      ...(key === "profile"
        ? {
            bodyProgress: {
              ...current.bodyProgress,
              currentWeight: (value as UserSettings["profile"]).weight,
            },
          }
        : {}),
      ...(key === "bodyProgress"
        ? {
            profile: {
              ...current.profile,
              weight: (value as UserSettings["bodyProgress"]).currentWeight,
            },
          }
        : {}),
    }));
    setSuccessMessage("");
    setErrorMessage("");
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", user.uid), {
        ...profileUpdateFromSettings(draftSettings),
        updatedAt: serverTimestamp(),
      });
      batch.set(
        doc(db, "users", user.uid, "settings", "preferences"),
        {
          ...storedSettingsFromForm(draftSettings),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await batch.commit();
      await updateProfile(user, {
        displayName: draftSettings.profile.fullName.trim(),
      }).catch(() => undefined);

      setSavedSettings(cloneSettings(draftSettings));
      setIsDirty(false);
      setSuccessMessage("Settings saved successfully.");
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      setErrorMessage(
        code === "permission-denied" || code === "firestore/permission-denied"
          ? "Settings could not be saved. Deploy the current Firestore rules first."
          : "Settings could not be saved. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraftSettings(cloneSettings(savedSettings));
    setSuccessMessage("");
    setErrorMessage("");
    setIsDirty(false);
  };

  return (
    <section className={styles.settingsPage} data-testid="settings-page">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Account settings</p>
            <h1>Settings</h1>
            <p>
              Manage profile, training, nutrition, privacy, and app preferences. Saved values are synchronized with
              your Firebase account and profile.
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
          ) : errorMessage ? (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          ) : (
            <span />
          )}
          <div className={styles.actionButtons}>
            <button type="button" className={styles.resetButton} onClick={handleReset} disabled={isSaving}>
              Cancel / Reset
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={() => void handleSave()}
              disabled={!isDirty || isSaving}
              data-testid="settings-save-button"
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>

        <AccountManagement />
      </div>
    </section>
  );
}
