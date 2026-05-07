"use client";

import styles from "./Calendar.module.css";
import { useTranslations } from "next-intl";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";

interface CalendarEntry {
  date: string;
  time: string;
  title: string;
  format: string;
}

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const { user, openAuth } = useAuth();
  const trainingEntries = t.raw("liveTrainings.entries") as CalendarEntry[];
  const seminarEntries = t.raw("liveSeminars.entries") as CalendarEntry[];

  return (
    <div className={styles.calendarContainer}>
      <h2 className={styles.title}>{t("title")}</h2>
      <p className={styles.subtitle}>{t("subtitle")}</p>
      {user ? (
        <div className={styles.calendarGrid}>
          <section className={styles.calendarDay}>
            <div className={styles.dateHeader}>{t("liveTrainings.title")}</div>
            <div className={styles.courses}>
              {trainingEntries.map((entry) => (
                <div key={`${entry.date}-${entry.time}-${entry.title}`} className={styles.courseCard}>
                  <div className={styles.courseInfo}>
                    <div className={styles.name}>{entry.title}</div>
                    <div className={styles.meta}>{entry.date}</div>
                    <div className={styles.time}>{entry.time} • {entry.format}</div>
                  </div>
                  <button className={styles.joinButton}>{t("join")}</button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.calendarDay}>
            <div className={styles.dateHeader}>{t("liveSeminars.title")}</div>
            <div className={styles.courses}>
              {seminarEntries.map((entry) => (
                <div key={`${entry.date}-${entry.time}-${entry.title}`} className={styles.courseCard}>
                  <div className={styles.courseInfo}>
                    <div className={styles.name}>{entry.title}</div>
                    <div className={styles.meta}>{entry.date}</div>
                    <div className={styles.time}>{entry.time} • {entry.format}</div>
                  </div>
                  <button className={styles.joinButton}>{t("join")}</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <MemberAccessCallout onSignIn={openAuth} />
      )}
    </div>
  );
}
