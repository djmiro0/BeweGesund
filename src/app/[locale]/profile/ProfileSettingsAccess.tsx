"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import styles from "./Profile.module.css";

interface ProfileSettingsAccessProps {
  locale: string;
  openLabel: string;
}

export default function ProfileSettingsAccess({
  locale,
  openLabel,
}: ProfileSettingsAccessProps) {
  return (
    <Link
      href={`/${locale}/settings`}
      className={styles.settingsTrigger}
      aria-label={openLabel}
      data-testid="profile-settings-trigger"
    >
      <Settings size={18} />
    </Link>
  );
}
