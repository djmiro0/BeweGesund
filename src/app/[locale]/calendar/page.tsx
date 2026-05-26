"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CalendarCheck2, Clock3, LockKeyhole, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import styles from "./Calendar.module.css";
import { activeScheduleDays, memberDashboard, type MemberPackage } from "@/data";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";

const packageRank: Record<MemberPackage, number> = {
  starter: 1,
  "rehab-plus": 2,
  "all-access": 3,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const courseT = useTranslations("courseCatalog");
  const packageT = useTranslations("packages");
  const locale = useLocale();
  const { user, openAuth } = useAuth();
  const [selectedDayId, setSelectedDayId] = useState(activeScheduleDays[0]?.id ?? "");

  const selectedDay = useMemo(
    () => activeScheduleDays.find((day) => day.id === selectedDayId) ?? activeScheduleDays[0],
    [selectedDayId],
  );

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [locale],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [locale],
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  if (!user) {
    return (
      <div className={styles.calendarContainer}>
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <MemberAccessCallout onSignIn={openAuth} />
      </div>
    );
  }

  return (
    <motion.div
      className={styles.calendarContainer}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
    >
      <motion.div className={styles.headerBlock} variants={fadeUp}>
        <div>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h2 className={styles.title}>{t("title")}</h2>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </div>
        <div className={styles.planCard}>
          <span className={styles.planLabel}>{t("memberPackage")}</span>
          <strong className={styles.planValue}>{packageT(memberDashboard.package)}</strong>
          <p className={styles.planHint}>{t("packageHint")}</p>
        </div>
      </motion.div>

      <motion.div className={styles.dayRail} role="tablist" aria-label={t("daySelectorLabel")} variants={fadeUp}>
        {activeScheduleDays.map((day) => {
          const isActive = day.id === selectedDay?.id;
          return (
            <motion.button
              key={day.id}
              type="button"
              className={`${styles.dayButton} ${isActive ? styles.dayButtonActive : ""}`}
              onClick={() => setSelectedDayId(day.id)}
              aria-pressed={isActive}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={styles.dayButtonTop}>{dayFormatter.format(new Date(day.date))}</span>
              <span className={styles.dayButtonCount}>
                {t("sessionCount", { count: day.entries.length })}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.section className={styles.schedulePanel} variants={fadeUp}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelLabel}>{t("selectedDay")}</p>
            <h3 className={styles.panelTitle}>
              {selectedDay ? dateFormatter.format(new Date(selectedDay.date)) : ""}
            </h3>
          </div>
          <div className={styles.panelLegend}>
            <span className={styles.legendItem}>
              <CalendarCheck2 size={16} />
              {t("included")}
            </span>
            <span className={styles.legendItem}>
              <LockKeyhole size={16} />
              {t("upgradeRequired")}
            </span>
          </div>
        </div>

        {selectedDay?.entries.length ? (
          <div className={styles.sessionList}>
            {selectedDay.entries.map((entry) => {
              const included =
                packageRank[memberDashboard.package] >= packageRank[entry.packageRequired];

              return (
                <motion.article
                  key={entry.id}
                  className={`${styles.sessionCard} ${included ? styles.sessionIncluded : styles.sessionLocked}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32 }}
                  whileHover={{ y: -4 }}
                >
                  <div className={styles.sessionPrimary}>
                    <div className={styles.sessionTimeBlock}>
                      <span className={styles.sessionTime}>
                        {timeFormatter.format(new Date(entry.startsAt))}
                      </span>
                      <span className={styles.sessionDuration}>
                        <Clock3 size={14} />
                        {t("duration", { count: entry.durationMinutes })}
                      </span>
                    </div>
                    <div className={styles.sessionCopy}>
                      <div className={styles.sessionBadges}>
                        <span className={styles.formatBadge}>
                          <Video size={14} />
                          {t(`formats.${entry.formatKey}`)}
                        </span>
                        <span className={styles.packageBadge}>
                          {packageT(entry.packageRequired)}
                        </span>
                      </div>
                      <h4 className={styles.sessionTitle}>{courseT(entry.titleKey)}</h4>
                      <div className={styles.sessionMeta}>
                        <span>{t("coach", { name: entry.coach })}</span>
                        <span>{t("startsLabel")}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.sessionAction}>
                    <span className={included ? styles.statusIncluded : styles.statusLocked}>
                      {included ? t("included") : t("upgradeRequired")}
                    </span>
                    <button
                      type="button"
                      className={`${styles.joinButton} ${included ? styles.joinButtonEnabled : styles.joinButtonDisabled}`}
                      disabled={!included}
                    >
                      {included ? t("join") : t("unlockButton")}
                    </button>
                    {!included ? (
                      <p className={styles.restrictionText}>
                        {t("needsPackage", { package: packageT(entry.packageRequired) })}
                      </p>
                    ) : (
                      <p className={styles.restrictionText}>{t("includedHint")}</p>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h4>{t("emptyTitle")}</h4>
            <p>{t("emptyDescription")}</p>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
