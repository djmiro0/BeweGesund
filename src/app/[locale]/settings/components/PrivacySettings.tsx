"use client";

import { useTranslations } from "next-intl";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import type { PrivacySettingsData } from "../settingsData";
import { SettingsSection, SettingsToggle } from "./SettingsControls";
import styles from "../Settings.module.css";
import { auth } from "../../../../../firebase.config";
import { useAuth } from "../../components/AuthProvider";

interface PrivacySettingsProps {
  data: PrivacySettingsData;
  onChange: (data: PrivacySettingsData) => void;
}

export default function PrivacySettings({
  data,
  onChange,
}: PrivacySettingsProps) {
  const t = useTranslations("settings");
  const { user } = useAuth();
  const [passwordMessage, setPasswordMessage] = useState("");

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      setPasswordMessage(t("messages.passwordResetSent"));
    } catch {
      setPasswordMessage(t("messages.passwordResetError"));
    }
  };

  return (
    <SettingsSection
      title={t("sections.privacy.title")}
      description={t("sections.privacy.description")}
      testId="settings-privacy-section"
    >
      <div className={styles.toggleList}>
        <SettingsToggle
          id="isPublicProfile"
          label={t("fields.publicProfile")}
          checked={data.isPublicProfile}
          onChange={(checked) =>
            onChange({ ...data, isPublicProfile: checked })
          }
        />
        <SettingsToggle
          id="showProgressPublicly"
          label={t("fields.showProgress")}
          checked={data.showProgressPublicly}
          onChange={(checked) =>
            onChange({ ...data, showProgressPublicly: checked })
          }
        />
      </div>

      <div className={styles.accountActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => void handlePasswordReset()}
        >
          {t("actions.changePassword")}
        </button>
        {passwordMessage ? <p role="status">{passwordMessage}</p> : null}
      </div>
    </SettingsSection>
  );
}
