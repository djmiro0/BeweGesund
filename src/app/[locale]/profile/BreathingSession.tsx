"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Play, X } from "lucide-react";
import styles from "./Profile.module.css";

interface BreathingSessionProps {
  locale: string;
  triggerLabel: string;
}

const STORAGE_KEY = "sbewegesund-breathing-hourly-reminder";
const SESSION_SECONDS = 60;
const phases = [
  { key: "inhale", seconds: 4 },
  { key: "hold", seconds: 2 },
  { key: "exhale", seconds: 6 },
] as const;

const copy = {
  de: {
    start: "Start",
    close: "Atemübung schließen",
    title: "60 Sekunden Atmung",
    inhale: "Einatmen",
    hold: "Halten",
    exhale: "Ausatmen",
    ready: "Bereit",
    reminderQuestion: "Möchtest du jede Stunde daran erinnert werden?",
    reminderOn: "Stündliche Erinnerung ist aktiv.",
    remind: "Jede Stunde erinnern",
    stopReminder: "Erinnerung ausschalten",
    notificationTitle: "Zeit für 60 Sekunden Atmung",
    notificationBody: "Öffne Bewegesund und nimm dir einen kurzen ruhigen Moment.",
  },
  en: {
    start: "Start",
    close: "Close breathing exercise",
    title: "60 seconds of breathing",
    inhale: "Inhale",
    hold: "Hold",
    exhale: "Exhale",
    ready: "Ready",
    reminderQuestion: "Would you like to be reminded every hour?",
    reminderOn: "Hourly reminder is active.",
    remind: "Remind me hourly",
    stopReminder: "Turn reminder off",
    notificationTitle: "Time for 60 seconds of breathing",
    notificationBody: "Open Bewegesund and take a short calm moment.",
  },
} as const;

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function BreathingSession({ locale, triggerLabel }: BreathingSessionProps) {
  const labels = locale === "de" ? copy.de : copy.en;
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (!isRunning) return undefined;

    const intervalId = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          vibrate([80, 40, 80]);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning]);

  const elapsed = SESSION_SECONDS - remaining;
  const cycleSeconds = phases.reduce((sum, phase) => sum + phase.seconds, 0);
  const phase = useMemo(() => {
    let phaseSecond = elapsed % cycleSeconds;

    for (const item of phases) {
      if (phaseSecond < item.seconds) return item;
      phaseSecond -= item.seconds;
    }

    return phases[0];
  }, [cycleSeconds, elapsed]);

  useEffect(() => {
    if (isRunning) vibrate(55);
  }, [isRunning, phase.key]);

  useEffect(() => {
    if (!reminderEnabled) return undefined;

    const intervalId = window.setInterval(() => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") {
        vibrate([80, 40, 80]);
        return;
      }

      new Notification(labels.notificationTitle, { body: labels.notificationBody });
    }, 60 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [labels.notificationBody, labels.notificationTitle, reminderEnabled]);

  const openSession = () => {
    setIsOpen(true);
    setIsRunning(false);
    setRemaining(SESSION_SECONDS);
  };

  const startSession = () => {
    setRemaining(SESSION_SECONDS);
    setIsRunning(true);
    vibrate(60);
  };

  const enableReminder = async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    window.localStorage.setItem(STORAGE_KEY, "true");
    setReminderEnabled(true);
  };

  const disableReminder = () => {
    window.localStorage.setItem(STORAGE_KEY, "false");
    setReminderEnabled(false);
  };

  return (
    <>
      <button type="button" className={styles.breathCircle} onClick={openSession}>
        <span>{triggerLabel}</span>
      </button>

      {isOpen ? (
        <div className={styles.breathModalOverlay}>
          <section className={styles.breathModal} role="dialog" aria-modal="true" aria-labelledby="breath-session-title">
            <button
              type="button"
              className={styles.breathClose}
              aria-label={labels.close}
              onClick={() => {
                setIsOpen(false);
                setIsRunning(false);
              }}
            >
              <X size={20} />
            </button>
            <p className={styles.panelEyebrow}>{labels.title}</p>
            <div className={`${styles.breathFocusCircle} ${isRunning ? styles.breathFocusCircleRunning : ""}`}>
              <span id="breath-session-title">{isRunning ? labels[phase.key] : labels.start}</span>
              <strong>{remaining}s</strong>
            </div>
            {!isRunning && remaining === SESSION_SECONDS ? (
              <button type="button" className={styles.breathStartButton} onClick={startSession}>
                <Play size={18} />
                {labels.start}
              </button>
            ) : null}
            {!isRunning && remaining === 0 ? (
              <div className={styles.breathReminderPanel}>
                <p>{reminderEnabled ? labels.reminderOn : labels.reminderQuestion}</p>
                {reminderEnabled ? (
                  <button type="button" onClick={disableReminder}>
                    <BellOff size={18} />
                    {labels.stopReminder}
                  </button>
                ) : (
                  <button type="button" onClick={() => void enableReminder()}>
                    <Bell size={18} />
                    {labels.remind}
                  </button>
                )}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
