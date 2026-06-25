"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import CalendarPicker from "react-calendar";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  LockKeyhole,
  Video,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import styles from "./Calendar.module.css";
import { packageRank } from "@/lib/memberPackages";
import type { CalendarDay } from "@/lib/contentful";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

type CalendarValue = Date | Date[] | [Date | null, Date | null] | null;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateKey: string, amount: number) {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export default function CalendarClient({ days }: { days: CalendarDay[] }) {
  const t = useTranslations("calendar");
  const packageT = useTranslations("packages");
  const locale = useLocale();
  const { user, memberPackage, openAuth } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [joiningEventId, setJoiningEventId] = useState("");
  const [joinError, setJoinError] = useState("");

  const daysByDate = useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  );

  const selectedDay = useMemo(
    () => daysByDate.get(selectedDate) ?? { id: selectedDate, date: selectedDate, entries: [] },
    [daysByDate, selectedDate],
  );

  const visibleDateKeys = useMemo(
    () => [-2, -1, 0, 1, 2].map((offset) => addDays(selectedDate, offset)),
    [selectedDate],
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

  const handleJoin = async (eventId: string) => {
    if (!user || joiningEventId) return;

    setJoiningEventId(eventId);
    setJoinError("");

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/calendar/join", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId, locale }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Join failed");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setJoinError(error instanceof Error && error.message !== "Join failed" ? error.message : t("joinError"));
      setJoiningEventId("");
    }
  };

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
            staggerChildren: 0.055,
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
          <strong className={styles.planValue}>{packageT(memberPackage)}</strong>
          <p className={styles.planHint}>{t("packageHint")}</p>
        </div>
      </motion.div>

      <motion.div className={styles.dayRail} role="tablist" aria-label={t("daySelectorLabel")} variants={fadeUp}>
        <motion.button
          type="button"
          className={styles.dayArrow}
          onClick={() => setSelectedDate((current) => addDays(current, -1))}
          aria-label={t("previousDay")}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          <ChevronLeft size={18} />
        </motion.button>

        <div className={styles.dayStrip}>
        {visibleDateKeys.map((dateKey) => {
          const day = daysByDate.get(dateKey) ?? { id: dateKey, date: dateKey, entries: [] };
          const isActive = dateKey === selectedDate;
          return (
            <motion.button
              key={day.id}
              type="button"
              className={`${styles.dayButton} ${isActive ? styles.dayButtonActive : ""}`}
              onClick={() => setSelectedDate(dateKey)}
              aria-pressed={isActive}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
            >
              {isActive ? (
                <motion.span
                  className={styles.dayActiveMark}
                  layoutId="active-calendar-day"
                  transition={{ type: "spring", stiffness: 520, damping: 36 }}
                />
              ) : null}
              <span className={styles.dayButtonTop}>{dayFormatter.format(fromDateKey(day.date))}</span>
              <span className={styles.dayButtonCount}>
                {t("sessionCount", { count: day.entries.length })}
              </span>
            </motion.button>
          );
        })}
        </div>

        <motion.button
          type="button"
          className={styles.dayArrow}
          onClick={() => setSelectedDate((current) => addDays(current, 1))}
          aria-label={t("nextDay")}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.96 }}
        >
          <ChevronRight size={18} />
        </motion.button>

        <motion.button
          type="button"
          className={styles.calendarOpenButton}
          onClick={() => setIsPickerOpen(true)}
          aria-label={t("openDatePicker")}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          <CalendarDays size={18} />
        </motion.button>
      </motion.div>

      {isPickerOpen ? (
        <motion.div
          className={styles.pickerBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsPickerOpen(false)}
        >
          <motion.div
            className={styles.pickerModal}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.pickerHeader}>
              <div>
                <p className={styles.panelLabel}>{t("datePickerLabel")}</p>
                <h3 className={styles.pickerTitle}>{t("datePickerTitle")}</h3>
              </div>
              <button
                type="button"
                className={styles.pickerCloseButton}
                onClick={() => setIsPickerOpen(false)}
                aria-label={t("closeDatePicker")}
              >
                <X size={18} />
              </button>
            </div>
            <CalendarPicker
              locale={locale}
              value={fromDateKey(selectedDate)}
              onChange={(value: CalendarValue) => {
                const selected = Array.isArray(value) ? value[0] : value;
                if (!selected) return;
                setSelectedDate(toDateKey(selected));
                setIsPickerOpen(false);
              }}
              tileContent={({ date, view }) => {
                if (view !== "month") return null;
                const eventCount = daysByDate.get(toDateKey(date))?.entries.length ?? 0;
                if (!eventCount) return null;

                return <span className={styles.calendarEventCount}>{eventCount}</span>;
              }}
              tileClassName={({ date, view }) => {
                if (view !== "month") return undefined;
                return daysByDate.has(toDateKey(date)) ? styles.calendarHasEvents : undefined;
              }}
            />
          </motion.div>
        </motion.div>
      ) : null}

      <motion.section className={styles.schedulePanel} variants={fadeUp}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelLabel}>{t("selectedDay")}</p>
            <h3 className={styles.panelTitle}>
              {selectedDay ? dateFormatter.format(fromDateKey(selectedDay.date)) : ""}
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
                packageRank[memberPackage] >= packageRank[entry.packageRequired];
              const canJoin = included && Boolean(entry.liveTrainingLink);

              return (
                <motion.article
                  key={entry.id}
                  className={`${styles.sessionCard} ${included ? styles.sessionIncluded : styles.sessionLocked}`}
                  initial={{ opacity: 0, y: 10, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2, scale: 1.006 }}
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
                        {entry.isLive ? (
                          <span className={styles.liveBadge}>{t("liveBadge")}</span>
                        ) : null}
                        <span className={styles.formatBadge}>
                          <Video size={14} />
                          {t(`formats.${entry.formatKey}`)}
                        </span>
                        <span className={styles.packageBadge}>
                          {packageT(entry.packageRequired)}
                        </span>
                      </div>
                      <h4 className={styles.sessionTitle}>{entry.title}</h4>
                      {entry.description ? (
                        <p className={styles.sessionDescription}>{entry.description}</p>
                      ) : null}
                      <div className={styles.sessionMeta}>
                        <span>{t("coach", { name: entry.coach })}</span>
                        <span>{t("startsLabel")}</span>
                        {entry.slug ? <span>{entry.slug}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className={styles.sessionAction}>
                    <span className={included ? styles.statusIncluded : styles.statusLocked}>
                      {included ? t("included") : t("upgradeRequired")}
                    </span>
                    {canJoin ? (
                      <button
                        type="button"
                        className={`${styles.joinButton} ${styles.joinButtonEnabled}`}
                        disabled={Boolean(joiningEventId)}
                        onClick={() => void handleJoin(entry.id)}
                      >
                        {joiningEventId === entry.id ? t("joining") : t("join")}
                        <ExternalLink size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.joinButton} ${styles.joinButtonDisabled}`}
                        disabled
                      >
                        {included ? t("missingLink") : t("unlockButton")}
                      </button>
                    )}
                    {!included ? (
                      <p className={styles.restrictionText}>
                        {t("needsPackage", { package: packageT(entry.packageRequired) })}
                      </p>
                    ) : (
                      <p className={styles.restrictionText}>
                        {entry.liveTrainingLink ? t("includedHint") : t("missingLinkHint")}
                      </p>
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
        {joinError ? <p className={styles.restrictionText} role="alert">{joinError}</p> : null}
      </motion.section>
    </motion.div>
  );
}
