"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  readCookieConsent,
  storeCookieConsent,
} from "@/app/components/ConsentAwareAnalytics";
import { COOKIE_CONSENT_EVENT } from "@/app/components/ConsentAwareAnalytics";
import styles from "./AppShell.module.css";

const copy = {
  de: {
    eyebrow: "Datenschutz",
    title: "Cookies & Analyse",
    body: "Wir verwenden notwendige Speicherfunktionen für den Betrieb der App. Analyse-Cookies setzen wir nur, wenn du zustimmst.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    privacy: "Datenschutz",
  },
  en: {
    eyebrow: "Privacy",
    title: "Cookies & analytics",
    body: "We use necessary storage for the app to work. Analytics cookies are only enabled if you consent.",
    accept: "Accept",
    decline: "Decline",
    privacy: "Privacy policy",
  },
} as const;

function subscribeToCookieConsent(callback: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getCookieConsentSnapshot() {
  return readCookieConsent()?.value ?? "unset";
}

export default function CookieConsentBanner({ locale }: { locale: string }) {
  const labels = locale === "de" ? copy.de : copy.en;
  const consent = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    () => "pending",
  );
  const isVisible = consent === "unset";

  const handleConsent = (value: "accepted" | "declined") => {
    storeCookieConsent(value);
  };

  if (!isVisible) return null;

  return (
    <section
      className={styles.cookieBanner}
      aria-labelledby="cookie-consent-title"
    >
      <div className={styles.cookieBannerCopy}>
        <p className={styles.cookieBannerEyebrow}>{labels.eyebrow}</p>
        <h2 id="cookie-consent-title">{labels.title}</h2>
        <p>{labels.body}</p>
        <Link href={`/${locale}/privacy`} className={styles.cookiePrivacyLink}>
          {labels.privacy}
        </Link>
      </div>
      <div className={styles.cookieBannerActions}>
        <button
          type="button"
          className={styles.cookieDeclineButton}
          onClick={() => handleConsent("declined")}
        >
          {labels.decline}
        </button>
        <button
          type="button"
          className={styles.cookieAcceptButton}
          onClick={() => handleConsent("accepted")}
        >
          {labels.accept}
        </button>
      </div>
    </section>
  );
}
