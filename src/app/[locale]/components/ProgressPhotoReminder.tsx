"use client";

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { Camera, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { db, storage } from "../../../../firebase.config";
import { useAuth } from "./AuthProvider";
import styles from "./ProgressPhotoReminder.module.css";
import { useModalDialog } from "./useModalDialog";

const REMINDER_WINDOW_DAYS = 7;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function ProgressPhotoReminder() {
  const t = useTranslations("progressPhotoReminder");
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dismissForSession = () => {
    if (user) {
      sessionStorage.setItem(
        `progress-photo-reminder:${user.uid}`,
        "dismissed",
      );
    }
    setIsOpen(false);
  };
  const dialogRef = useModalDialog<HTMLElement>(
    Boolean(user && isOpen),
    dismissForSession,
  );

  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    const creationTime = user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : Number.NaN;
    const accountAge = Date.now() - creationTime;
    const isWithinReminderWindow =
      Number.isFinite(accountAge) &&
      accountAge >= 0 &&
      accountAge <= REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const dismissedThisSession =
      sessionStorage.getItem(`progress-photo-reminder:${user.uid}`) ===
      "dismissed";

    if (!isWithinReminderWindow || dismissedThisSession) {
      setIsOpen(false);
      return;
    }

    return onSnapshot(
      doc(db, "users", user.uid, "settings", "preferences"),
      (snapshot) => {
        const progressPhotos = snapshot.exists()
          ? (snapshot.data().progressPhotos as
              Record<string, unknown> | undefined)
          : undefined;
        const reminderEnabled = progressPhotos?.reminderEnabled !== false;
        const hasBeforePhoto =
          typeof progressPhotos?.beforeUploadedAt === "string" &&
          progressPhotos.beforeUploadedAt.length > 0;
        setIsOpen(reminderEnabled && !hasBeforePhoto);
      },
      () => setIsOpen(false),
    );
  }, [user]);

  if (!user || !isOpen) return null;

  const disableReminder = async () => {
    setErrorMessage("");
    try {
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        { progressPhotos: { reminderEnabled: false } },
        { merge: true },
      );
      setIsOpen(false);
    } catch {
      setErrorMessage(t("saveError"));
    }
  };

  const uploadBeforePhoto = async (file: File) => {
    if (!allowedPhotoTypes.has(file.type)) {
      setErrorMessage(t("typeError"));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setErrorMessage(t("sizeError"));
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    try {
      const uploadedAt = new Date().toISOString();
      await uploadBytes(
        ref(storage, `users/${user.uid}/progress/before`),
        file,
        {
          contentType: file.type,
          cacheControl: "private,max-age=3600",
        },
      );
      await setDoc(
        doc(db, "users", user.uid, "settings", "preferences"),
        {
          progressPhotos: {
            beforeUploadedAt: uploadedAt,
            reminderEnabled: true,
          },
        },
        { merge: true },
      );
      setIsOpen(false);
    } catch {
      setErrorMessage(t("uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      data-testid="progress-photo-reminder-overlay"
    >
      <section
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-photo-reminder-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.closeButton}
          aria-label={t("close")}
          onClick={dismissForSession}
        >
          <X size={18} />
        </button>
        <div className={styles.icon} aria-hidden="true">
          <Camera size={26} />
        </div>
        <p className={styles.eyebrow}>{t("eyebrow")}</p>
        <h2 id="progress-photo-reminder-title">{t("title")}</h2>
        <p className={styles.description}>{t("description")}</p>

        <label className={styles.uploadButton}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={t("upload")}
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadBeforePhoto(file);
              event.target.value = "";
            }}
          />
          <span>{isUploading ? t("uploading") : t("upload")}</span>
        </label>
        <button
          type="button"
          className={styles.laterButton}
          onClick={dismissForSession}
        >
          {t("later")}
        </button>
        <button
          type="button"
          className={styles.disableButton}
          onClick={() => void disableReminder()}
        >
          {t("disable")}
        </button>
        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
        <p className={styles.privacy}>{t("privacy")}</p>
      </section>
    </div>
  );
}
