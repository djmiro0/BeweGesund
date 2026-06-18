"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { isMobileDevice, isStandalonePwa, PWA_INSTALL_REQUEST_EVENT } from "@/lib/pwaInstall";
import styles from "../Settings.module.css";

export default function PwaInstallAction() {
  const t = useTranslations("settings");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(isMobileDevice() && !isStandalonePwa());
    }, 0);
    const handleInstalled = () => setIsVisible(false);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={styles.installAppRow} data-testid="settings-install-app">
      <div>
        <strong>{t("installApp.title")}</strong>
        <p>{t("installApp.description")}</p>
      </div>
      <button
        type="button"
        className={styles.installAppButton}
        onClick={() => window.dispatchEvent(new Event(PWA_INSTALL_REQUEST_EVENT))}
      >
        <Download size={18} aria-hidden="true" />
        {t("installApp.action")}
      </button>
    </div>
  );
}
