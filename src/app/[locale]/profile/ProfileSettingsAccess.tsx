"use client";

import Link from "next/link";
import { Settings, X } from "lucide-react";
import { useState } from "react";
import styles from "./Profile.module.css";

interface ProfileSettingsAccessProps {
  locale: string;
  openLabel: string;
  closeLabel: string;
  title: string;
  description: string;
  settingsLabel: string;
}

export default function ProfileSettingsAccess({
  locale,
  openLabel,
  closeLabel,
  title,
  description,
  settingsLabel,
}: ProfileSettingsAccessProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.settingsTrigger}
        aria-label={openLabel}
        aria-expanded={isOpen}
        data-testid="profile-settings-trigger"
        onClick={() => setIsOpen(true)}
      >
        <Settings size={18} />
      </button>

      {isOpen ? (
        <div className={styles.settingsOverlay} data-testid="profile-settings-overlay">
          <button
            type="button"
            className={styles.settingsBackdrop}
            aria-label={closeLabel}
            data-testid="profile-settings-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <aside
            className={styles.settingsPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-settings-title"
            data-testid="profile-settings-panel"
          >
            <button
              type="button"
              className={styles.settingsClose}
              aria-label={closeLabel}
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
            <div className={styles.settingsPanelIcon}>
              <Settings size={22} />
            </div>
            <h2 id="profile-settings-title">{title}</h2>
            <p>{description}</p>
            <Link
              href={`/${locale}/settings`}
              className={styles.settingsLink}
              data-testid="profile-settings-link"
              onClick={() => setIsOpen(false)}
            >
              {settingsLabel}
            </Link>
          </aside>
        </div>
      ) : null}
    </>
  );
}
