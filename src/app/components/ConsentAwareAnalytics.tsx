"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";

export const COOKIE_CONSENT_STORAGE_KEY = "bewegesund-cookie-consent";
export const COOKIE_CONSENT_EVENT = "bewegesund-cookie-consent-change";
export const COOKIE_CONSENT_VERSION = "1";

type CookieConsentValue = "accepted" | "declined";

export interface StoredCookieConsent {
  value: CookieConsentValue;
  version: string;
  updatedAt: string;
}

export function readCookieConsent() {
  if (typeof window === "undefined") return null;

  try {
    const rawConsent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!rawConsent) return null;
    const parsed = JSON.parse(rawConsent) as Partial<StoredCookieConsent>;

    return parsed.version === COOKIE_CONSENT_VERSION &&
      (parsed.value === "accepted" || parsed.value === "declined")
      ? (parsed as StoredCookieConsent)
      : null;
  } catch {
    return null;
  }
}

export function storeCookieConsent(value: CookieConsentValue) {
  if (typeof window === "undefined") return;

  const consent: StoredCookieConsent = {
    value,
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify(consent),
  );
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }),
  );
}

export default function ConsentAwareAnalytics() {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      setHasAnalyticsConsent(readCookieConsent()?.value === "accepted");
    };

    syncConsent();
    window.addEventListener(COOKIE_CONSENT_EVENT, syncConsent);
    window.addEventListener("storage", syncConsent);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, syncConsent);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  return hasAnalyticsConsent ? <Analytics /> : null;
}
