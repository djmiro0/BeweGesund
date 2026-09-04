"use client";

import { Download, Share, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import styles from "./PwaInstallPrompt.module.css";
import { useModalDialog } from "./useModalDialog";
import {
  isMobileDevice,
  isStandalonePwa,
  PWA_INSTALL_REQUEST_EVENT,
} from "@/lib/pwaInstall";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PROMPT_SEEN_KEY = "pwa-install-prompt-seen";

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PwaInstallPrompt() {
  const t = useTranslations("pwaInstall");
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useModalDialog<HTMLElement>(isOpen, () => setIsOpen(false));

  useEffect(() => {
    if (isStandalonePwa() || !isMobileDevice()) return;

    const hasSeenPrompt = localStorage.getItem(PROMPT_SEEN_KEY) === "true";
    const openFirstPrompt = () => {
      if (hasSeenPrompt) return;
      localStorage.setItem(PROMPT_SEEN_KEY, "true");
      setIsOpen(true);
    };
    const iosPromptTimer = isIosDevice()
      ? window.setTimeout(() => {
          setShowIosInstructions(true);
          setIsAvailable(true);
          openFirstPrompt();
        }, 0)
      : undefined;

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsAvailable(true);
      openFirstPrompt();
    };
    const handleInstalled = () => {
      setInstallEvent(null);
      setIsAvailable(false);
      setIsOpen(false);
    };
    const handleInstallRequest = () => {
      setShowIosInstructions(isIosDevice());
      setIsAvailable(true);
      setIsOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener(PWA_INSTALL_REQUEST_EVENT, handleInstallRequest);
    return () => {
      if (iosPromptTimer !== undefined) window.clearTimeout(iosPromptTimer);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener(
        PWA_INSTALL_REQUEST_EVENT,
        handleInstallRequest,
      );
    };
  }, []);

  if (!isAvailable) return null;

  const dismiss = () => {
    setIsOpen(false);
  };

  const install = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstallEvent(null);
      setIsAvailable(false);
      setIsOpen(false);
      return;
    }

    dismiss();
  };

  return (
    <>
      {isOpen ? (
        <div className={styles.overlay} data-testid="pwa-install-overlay">
          <section
            ref={dialogRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            tabIndex={-1}
          >
            <button
              type="button"
              className={styles.closeButton}
              aria-label={t("close")}
              onClick={dismiss}
            >
              <X size={18} />
            </button>

            <Image
              className={styles.appIcon}
              src="/icon-192.png"
              alt=""
              width={64}
              height={64}
            />
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h2 id="pwa-install-title">{t("title")}</h2>
            <p className={styles.description}>
              {showIosInstructions ? t("iosDescription") : t("description")}
            </p>

            {showIosInstructions ? (
              <ol className={styles.steps}>
                <li>
                  <Share size={19} aria-hidden="true" />
                  <span>{t("iosStepShare")}</span>
                </li>
                <li>
                  <Download size={19} aria-hidden="true" />
                  <span>{t("iosStepAdd")}</span>
                </li>
              </ol>
            ) : null}

            {installEvent ? (
              <button
                type="button"
                className={styles.installButton}
                onClick={() => void install()}
              >
                <Download size={18} aria-hidden="true" />
                {t("install")}
              </button>
            ) : (
              <button
                type="button"
                className={styles.installButton}
                onClick={dismiss}
              >
                {t("understood")}
              </button>
            )}
            <button
              type="button"
              className={styles.laterButton}
              onClick={dismiss}
            >
              {t("later")}
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
