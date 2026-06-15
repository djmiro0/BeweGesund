"use client";

import { getBlob, ref } from "firebase/storage";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { storage } from "../../../../../firebase.config";
import type { ProgressPhotosData } from "../settingsData";
import { SettingsSection, SettingsToggle } from "./SettingsControls";
import styles from "../Settings.module.css";

type ProgressPhotoSlot = "before" | "after";

interface ProgressPhotoSettingsProps {
  userId: string;
  data: ProgressPhotosData;
  uploadingSlot: ProgressPhotoSlot | null;
  onChange: (data: ProgressPhotosData) => void;
  onPhotoSelect: (slot: ProgressPhotoSlot, file: File) => void;
}

function usePrivatePhotoPreview(userId: string, slot: ProgressPhotoSlot, uploadedAt: string) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!uploadedAt) return;

    let objectUrl = "";
    let cancelled = false;

    void getBlob(ref(storage, `users/${userId}/progress/${slot}`))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl("");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [slot, uploadedAt, userId]);

  return uploadedAt ? previewUrl : "";
}

export default function ProgressPhotoSettings({
  userId,
  data,
  uploadingSlot,
  onChange,
  onPhotoSelect,
}: ProgressPhotoSettingsProps) {
  const t = useTranslations("settings");
  const beforePreview = usePrivatePhotoPreview(userId, "before", data.beforeUploadedAt);
  const afterPreview = usePrivatePhotoPreview(userId, "after", data.afterUploadedAt);

  const cards: Array<{
    slot: ProgressPhotoSlot;
    title: string;
    description: string;
    uploadedAt: string;
    previewUrl: string;
  }> = [
    {
      slot: "before",
      title: t("sections.progressPhotos.beforeTitle"),
      description: t("sections.progressPhotos.beforeDescription"),
      uploadedAt: data.beforeUploadedAt,
      previewUrl: beforePreview,
    },
    {
      slot: "after",
      title: t("sections.progressPhotos.afterTitle"),
      description: t("sections.progressPhotos.afterDescription"),
      uploadedAt: data.afterUploadedAt,
      previewUrl: afterPreview,
    },
  ];

  return (
    <SettingsSection
      title={t("sections.progressPhotos.title")}
      description={t("sections.progressPhotos.description")}
      testId="settings-progress-photos-section"
    >
      <div className={styles.progressPhotoGrid}>
        {cards.map((card) => (
          <article className={styles.progressPhotoCard} key={card.slot}>
            <div
              className={styles.progressPhotoPreview}
              style={card.previewUrl ? { backgroundImage: `url("${card.previewUrl}")` } : undefined}
              data-testid={`progress-photo-${card.slot}-preview`}
            >
              {!card.previewUrl ? <span>{t("sections.progressPhotos.empty")}</span> : null}
            </div>
            <div className={styles.progressPhotoCopy}>
              <strong>{card.title}</strong>
              <p>{card.description}</p>
              {card.uploadedAt ? (
                <small>{t("sections.progressPhotos.uploaded")}</small>
              ) : null}
            </div>
            <label className={styles.progressPhotoButton}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={t(`sections.progressPhotos.${card.slot}Action`)}
                disabled={uploadingSlot !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onPhotoSelect(card.slot, file);
                  event.target.value = "";
                }}
              />
              <span>
                {uploadingSlot === card.slot
                  ? t("sections.progressPhotos.uploading")
                  : t(`sections.progressPhotos.${card.slot}Action`)}
              </span>
            </label>
          </article>
        ))}
      </div>

      <SettingsToggle
        id="progressPhotoReminder"
        label={t("fields.progressPhotoReminder")}
        checked={data.reminderEnabled}
        testId="settings-toggle-progressPhotoReminder"
        onChange={(reminderEnabled) => onChange({ ...data, reminderEnabled })}
      />
      <p className={styles.progressPhotoPrivacy}>{t("sections.progressPhotos.privacy")}</p>
    </SettingsSection>
  );
}
