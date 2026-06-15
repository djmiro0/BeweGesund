"use client";

import { updateProfile } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db, storage } from "../../../../firebase.config";
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
import { languageToLocale } from "@/lib/appPreferences";

function cloneSettings(settings: UserSettings): UserSettings {
  return structuredClone(settings);
}

export default function SettingsPage() {
  const locale = useLocale();
  const t = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();
  const settingsLoadError = t("messages.loadError");
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
        setErrorMessage(settingsLoadError);
        setPreferencesLoaded(true);
      },
    );
  }, [settingsLoadError, userId]);

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
      if (draftSettings.notifications.pushNotifications) {
        if (typeof Notification === "undefined") {
          setErrorMessage(t("messages.pushUnsupported"));
          return;
        }

        const permission = Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

        if (permission !== "granted") {
          setErrorMessage(t("messages.pushPermissionDenied"));
          return;
        }
      }

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
      setSuccessMessage(t("messages.saveSuccess"));

      const nextLocale = languageToLocale(draftSettings.app.language);
      if (nextLocale !== locale) {
        const nextPath = pathname.replace(/^\/(de|en)(?=\/|$)/, `/${nextLocale}`);
        router.replace(nextPath);
      }
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      setErrorMessage(
        code === "permission-denied" || code === "firestore/permission-denied"
          ? t("messages.permissionError")
          : t("messages.saveError"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelect = async (file: File) => {
    if (!user || isUploadingPhoto) return;

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type)) {
      setErrorMessage(t("messages.photoTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(t("messages.photoSizeError"));
      return;
    }

    setIsUploadingPhoto(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const avatarRef = ref(storage, `users/${user.uid}/profile/avatar`);
      await uploadBytes(avatarRef, file, {
        contentType: file.type,
        cacheControl: "private,max-age=3600",
      });
      const downloadUrl = await getDownloadURL(avatarRef);
      const photoURL = `${downloadUrl}${downloadUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;

      await Promise.all([
        updateDoc(doc(db, "users", user.uid), {
          photoURL,
          updatedAt: serverTimestamp(),
        }),
        updateProfile(user, { photoURL }),
      ]);

      const applyPhoto = (settings: UserSettings) => ({
        ...settings,
        profile: {
          ...settings.profile,
          profileImageUrl: photoURL,
        },
      });
      setDraftSettings(applyPhoto);
      setSavedSettings(applyPhoto);
      setSuccessMessage(t("messages.photoSuccess"));
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      setErrorMessage(
        code === "storage/unauthorized"
          ? t("messages.photoPermissionError")
          : code === "storage/bucket-not-found" || code === "storage/unknown"
            ? t("messages.photoStorageError")
          : t("messages.photoError"),
      );
    } finally {
      setIsUploadingPhoto(false);
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
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
          </div>
        </header>

        <div className={styles.layout}>
          <ProfileSettings
            data={draftSettings.profile}
            onChange={(value) => updateSection("profile", value)}
            onPhotoSelect={(file) => void handlePhotoSelect(file)}
            isUploadingPhoto={isUploadingPhoto}
            unitSystem={draftSettings.app.units}
          />
          <BodyProgressSettings
            data={draftSettings.bodyProgress}
            unitSystem={draftSettings.app.units}
            onChange={(value) => updateSection("bodyProgress", value)}
          />
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
              {t("actions.reset")}
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={() => void handleSave()}
              disabled={!isDirty || isSaving}
              data-testid="settings-save-button"
            >
              {isSaving ? t("actions.saving") : t("actions.save")}
            </button>
          </div>
        </div>

        <AccountManagement />
      </div>
    </section>
  );
}
