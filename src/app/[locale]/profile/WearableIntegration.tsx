"use client";

import { httpsCallable } from "firebase/functions";
import { Activity, Footprints, HeartPulse, LoaderCircle, Moon, PlugZap, Unplug } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { functions } from "../../../../firebase.config";
import styles from "./Profile.module.css";

interface WearableIntegrationProps {
  locale: string;
}

interface AuthorizationResult {
  url?: string;
}

interface ConnectionStatusResult {
  connected?: boolean;
}

interface WearableSummary {
  steps?: number;
  activeMinutes?: number;
  restingHeartRate?: number | null;
  sleepMinutes?: number | null;
}

interface SyncResult {
  summary?: WearableSummary;
}

export default function WearableIntegration({ locale }: WearableIntegrationProps) {
  const t = useTranslations("profile.wearables");
  const [isConnected, setIsConnected] = useState(false);
  const [summary, setSummary] = useState<WearableSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState("");
  const syncInFlightRef = useRef(false);

  const loadStatus = useCallback(async () => {
    setError("");

    try {
      const getStatus = httpsCallable<unknown, ConnectionStatusResult>(functions, "getGoogleHealthConnectionStatus");
      const status = await getStatus({});
      setIsConnected(Boolean(status.data.connected));
    } catch {
      setError(t("statusError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const syncSummary = useCallback(async () => {
    if (syncInFlightRef.current) return;

    syncInFlightRef.current = true;
    setIsSyncing(true);
    setError("");

    try {
      const sync = httpsCallable<unknown, SyncResult>(functions, "syncGoogleHealthDailySummary");
      const result = await sync({});
      setSummary(result.data.summary ?? null);
      setIsConnected(true);
    } catch {
      setError(t("syncError"));
    } finally {
      syncInFlightRef.current = false;
      setIsSyncing(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (isConnected && !summary) {
      void syncSummary();
    }
  }, [isConnected, summary, syncSummary]);

  const connectWearable = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setError("");

    try {
      const createUrl = httpsCallable<{ locale: string }, AuthorizationResult>(
        functions,
        "createGoogleHealthAuthorizationUrl",
      );
      const result = await createUrl({ locale });

      if (!result.data.url) throw new Error("Missing Google Health authorization URL.");

      window.location.assign(result.data.url);
    } catch {
      setError(t("connectError"));
      setIsSyncing(false);
    }
  };

  const disconnectWearable = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setError("");

    try {
      const disconnect = httpsCallable<unknown, { ok?: boolean }>(functions, "disconnectGoogleHealth");
      await disconnect({});
      setIsConnected(false);
      setSummary(null);
    } catch {
      setError(t("disconnectError"));
    } finally {
      setIsSyncing(false);
    }
  };

  const statItems = [
    {
      label: t("steps"),
      value: summary?.steps != null ? new Intl.NumberFormat(locale).format(summary.steps) : "-",
      icon: Footprints,
    },
    {
      label: t("activeMinutes"),
      value: summary?.activeMinutes != null ? t("minutes", { count: summary.activeMinutes }) : "-",
      icon: Activity,
    },
    {
      label: t("sleep"),
      value: summary?.sleepMinutes != null ? t("hours", { count: Math.round(summary.sleepMinutes / 6) / 10 }) : "-",
      icon: Moon,
    },
    {
      label: t("restingHeartRate"),
      value: summary?.restingHeartRate != null ? t("bpm", { count: summary.restingHeartRate }) : "-",
      icon: HeartPulse,
    },
  ];

  return (
    <div className={styles.wearablePanel}>
      <div className={styles.wearableHeader}>
        <div>
          <p className={styles.panelEyebrow}>{t("eyebrow")}</p>
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
        </div>
        <span className={isConnected ? styles.wearableStatusConnected : styles.wearableStatus}>
          {isConnected ? t("connected") : t("notConnected")}
        </span>
      </div>

      {isConnected ? (
        <div className={styles.wearableStats}>
          {statItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className={styles.wearableStat}>
                <Icon size={22} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={styles.wearableActions}>
        {isConnected ? (
          <>
            <button type="button" onClick={() => void syncSummary()} disabled={isLoading || isSyncing}>
              {isSyncing ? <LoaderCircle className={styles.billingSpinner} size={17} /> : <PlugZap size={17} />}
              {isSyncing ? t("syncing") : t("sync")}
            </button>
            <button type="button" onClick={() => void disconnectWearable()} disabled={isLoading || isSyncing}>
              <Unplug size={17} />
              {t("disconnect")}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => void connectWearable()} disabled={isLoading || isSyncing}>
            {isSyncing ? <LoaderCircle className={styles.billingSpinner} size={17} /> : <PlugZap size={17} />}
            {isSyncing ? t("opening") : t("connect")}
          </button>
        )}
      </div>

      {error ? <p className={styles.billingError} role="alert">{error}</p> : null}
      <p className={styles.packageHint}>{t("privacy")}</p>
    </div>
  );
}
