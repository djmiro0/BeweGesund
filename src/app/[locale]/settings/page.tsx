"use client";

import { updateProfile } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  Activity,
  ArrowLeft,
  Bell,
  Camera,
  Dumbbell,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
  UserX,
  Utensils,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import { db, storage } from "../../../../firebase.config";
import { useAuth } from "../components/AuthProvider";
import BackButton from "../components/BackButton";
import AppSettings from "./components/AppSettings";
import AccountManagement from "./components/AccountManagement";
import BodyProgressSettings from "./components/BodyProgressSettings";
import GamificationSummary from "./components/GamificationSummary";
import NotificationSettings from "./components/NotificationSettings";
import NutritionSettings from "./components/NutritionSettings";
import PrivacySettings from "./components/PrivacySettings";
import ProfileSettings from "./components/ProfileSettings";
import ProgressPhotoSettings from "./components/ProgressPhotoSettings";
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

type SettingsSectionId =
  | "profile"
  | "body"
  | "progressPhotos"
  | "workout"
  | "nutrition"
  | "gamification"
  | "notifications"
  | "privacy"
  | "app"
  | "account";

interface SettingsNavItem {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  content: ReactNode;
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
  const [uploadingProgressPhoto, setUploadingProgressPhoto] = useState<"before" | "after" | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("profile");

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

  const handleProgressPhotoSelect = async (slot: "before" | "after", file: File) => {
    if (!user || uploadingProgressPhoto) return;

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type)) {
      setErrorMessage(t("messages.progressPhotoTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(t("messages.progressPhotoSizeError"));
      return;
    }

    setUploadingProgressPhoto(slot);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const uploadedAt = new Date().toISOString();
      await uploadBytes(ref(storage, `users/${user.uid}/progress/${slot}`), file, {
        contentType: file.type,
        cacheControl: "private,max-age=3600",
      });
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        {
          progressPhotos: {
            ...draftSettings.progressPhotos,
            [`${slot}UploadedAt`]: uploadedAt,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const applyProgressPhoto = (settings: UserSettings) => ({
        ...settings,
        progressPhotos: {
          ...settings.progressPhotos,
          [`${slot}UploadedAt`]: uploadedAt,
        },
      });
      setDraftSettings(applyProgressPhoto);
      setSavedSettings(applyProgressPhoto);
      setSuccessMessage(t("messages.progressPhotoSuccess"));
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      setErrorMessage(
        code === "storage/unauthorized"
          ? t("messages.photoPermissionError")
          : t("messages.progressPhotoError"),
      );
    } finally {
      setUploadingProgressPhoto(null);
    }
  };

  const handleReset = () => {
    setDraftSettings(cloneSettings(savedSettings));
    setSuccessMessage("");
    setErrorMessage("");
    setIsDirty(false);
  };

  const settingsSections: SettingsNavItem[] = [
    {
      id: "profile",
      title: t("sections.profile.title"),
      description: t("sections.profile.description"),
      icon: UserRound,
      content: (
        <ProfileSettings
          data={draftSettings.profile}
          onChange={(value) => updateSection("profile", value)}
          onPhotoSelect={(file) => void handlePhotoSelect(file)}
          isUploadingPhoto={isUploadingPhoto}
          unitSystem={draftSettings.app.units}
        />
      ),
    },
    {
      id: "body",
      title: t("sections.body.title"),
      description: t("sections.body.description"),
      icon: Activity,
      content: (
        <BodyProgressSettings
          data={draftSettings.bodyProgress}
          unitSystem={draftSettings.app.units}
          onChange={(value) => updateSection("bodyProgress", value)}
        />
      ),
    },
    ...(user
      ? [{
          id: "progressPhotos" as const,
          title: t("sections.progressPhotos.title"),
          description: t("sections.progressPhotos.description"),
          icon: Camera,
          content: (
            <ProgressPhotoSettings
              userId={user.uid}
              data={draftSettings.progressPhotos}
              uploadingSlot={uploadingProgressPhoto}
              onChange={(value) => updateSection("progressPhotos", value)}
              onPhotoSelect={(slot, file) => void handleProgressPhotoSelect(slot, file)}
            />
          ),
        }]
      : []),
    {
      id: "workout",
      title: t("sections.workout.title"),
      description: t("sections.workout.description"),
      icon: Dumbbell,
      content: <WorkoutPreferences data={draftSettings.workoutPreferences} onChange={(value) => updateSection("workoutPreferences", value)} />,
    },
    {
      id: "nutrition",
      title: t("sections.nutrition.title"),
      description: t("sections.nutrition.description"),
      icon: Utensils,
      content: <NutritionSettings data={draftSettings.nutrition} onChange={(value) => updateSection("nutrition", value)} />,
    },
    {
      id: "gamification",
      title: t("sections.gamification.title"),
      description: t("sections.gamification.description"),
      icon: Trophy,
      content: <GamificationSummary data={draftSettings.gamification} />,
    },
    {
      id: "notifications",
      title: t("sections.notifications.title"),
      description: t("sections.notifications.description"),
      icon: Bell,
      content: <NotificationSettings data={draftSettings.notifications} onChange={(value) => updateSection("notifications", value)} />,
    },
    {
      id: "privacy",
      title: t("sections.privacy.title"),
      description: t("sections.privacy.description"),
      icon: ShieldCheck,
      content: <PrivacySettings data={draftSettings.privacy} onChange={(value) => updateSection("privacy", value)} />,
    },
    {
      id: "app",
      title: t("sections.app.title"),
      description: t("sections.app.description"),
      icon: SlidersHorizontal,
      content: <AppSettings data={draftSettings.app} onChange={(value) => updateSection("app", value)} />,
    },
    {
      id: "account",
      title: t("sections.account.title"),
      description: t("sections.account.description"),
      icon: UserX,
      content: <AccountManagement />,
    },
  ];
  const activeSettingsSection = settingsSections.find((section) => section.id === activeSection) ?? settingsSections[0];
  const showSaveActions = activeSettingsSection.id !== "account";

  return (
    <section className={styles.settingsPage} data-testid="settings-page">
      <div className={styles.shell}>
        <BackButton
          href={`/${locale}/profile`}
          className={styles.backLink}
          data-testid="settings-back-link"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{t("actions.backToProfile")}</span>
        </BackButton>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{t("navigation.profileFallback")}</p>
            <h1>{t("title")}</h1>
          </div>
        </header>

        <div className={styles.settingsWorkspace}>
          <aside className={styles.settingsSidebar} aria-label={t("navigation.label")}>
            <div className={styles.sidebarProfile}>
              <div
                className={styles.sidebarAvatar}
                style={draftSettings.profile.profileImageUrl ? { backgroundImage: `url("${draftSettings.profile.profileImageUrl}")` } : undefined}
                aria-hidden="true"
              >
                {draftSettings.profile.profileImageUrl ? null : draftSettings.profile.fullName.charAt(0)}
              </div>
              <div>
                <strong>{draftSettings.profile.fullName || t("navigation.profileFallback")}</strong>
                <span>{draftSettings.profile.email}</span>
              </div>
            </div>
            <nav className={styles.settingsNav}>
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSettingsSection.id === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    className={`${styles.settingsNavButton} ${isActive ? styles.settingsNavButtonActive : ""}`}
                    aria-label={section.title}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon size={18} aria-hidden />
                    <span>
                      <strong>{section.title}</strong>
                      <small>{section.description}</small>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className={styles.settingsDetail}>
            <div className={styles.activeSectionIntro}>
              <p>{t("navigation.currentSection")}</p>
              <h2>{activeSettingsSection.title}</h2>
            </div>
            {activeSettingsSection.content}
            {showSaveActions ? (
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
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
