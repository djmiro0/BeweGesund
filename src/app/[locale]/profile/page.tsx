"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, HeartPulse, Ruler, Scale, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, type AuthError } from "firebase/auth";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase.config";
import { memberCourses, type MemberPackage } from "@/data";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import styles from "./Profile.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const getCourseMeta = (courseId: string) => memberCourses.find((course) => course.id === courseId);

type AnamnesisStatus = "pending" | "completed" | "review-required";

interface ProfileData {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  occupationKey: "sedentary" | "standing" | "physical" | null;
  averageStepsPerDay: number | null;
  primaryGoalKey: string | null;
  memberPackage: MemberPackage | null;
  startedCourseIds: string[];
  completedCourseIds: string[];
  recommendedCourseIds: string[];
  anamnesisStatusKey: AnamnesisStatus;
}

const emptyProfile: ProfileData = {
  email: null,
  displayName: null,
  photoURL: null,
  dateOfBirth: null,
  heightCm: null,
  weightKg: null,
  occupationKey: null,
  averageStepsPerDay: null,
  primaryGoalKey: null,
  memberPackage: null,
  startedCourseIds: [],
  completedCourseIds: [],
  recommendedCourseIds: [],
  anamnesisStatusKey: "pending",
};

const isKnownCourse = (courseId: string) => memberCourses.some((course) => course.id === courseId);
const translatedGoalKeys = ["backPain"];

export default function ProfilePage() {
  const t = useTranslations("profile");
  const courseT = useTranslations("courseCatalog");
  const packageT = useTranslations("packages");
  const locale = useLocale();
  const router = useRouter();
  const { user, openAuth } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    void getDoc(doc(db, "users", user.uid)).then((snapshot) => {
      if (!snapshot.exists()) return;

      setProfile((currentProfile) => ({
        ...currentProfile,
        ...snapshot.data(),
      }));
    });
  }, [user]);

  if (!user) {
    return (
      <section className={styles.profileSection}>
        <div className={styles.shell}>
          <MemberAccessCallout onSignIn={openAuth} />
        </div>
      </section>
    );
  }

  const displayName = user.displayName || profile.displayName || t("values.notProvided");
  const email = user.email || profile.email || t("values.notProvided");
  const avatar = user.photoURL || profile.photoURL;
  const profileInitial = displayName.charAt(0).toUpperCase();
  const bmi = profile.heightCm && profile.weightKg
    ? profile.weightKg / ((profile.heightCm / 100) * (profile.heightCm / 100))
    : null;
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const goalValue = profile.primaryGoalKey
    ? translatedGoalKeys.includes(profile.primaryGoalKey)
      ? t(`goals.${profile.primaryGoalKey}`)
      : profile.primaryGoalKey
    : t("values.notProvided");

  const personalDetails = [
    {
      label: t("details.dateOfBirth"),
      value: profile.dateOfBirth ? dateFormatter.format(new Date(profile.dateOfBirth)) : t("values.notProvided"),
    },
    {
      label: t("details.height"),
      value: profile.heightCm ? t("values.height", { count: profile.heightCm }) : t("values.notProvided"),
    },
    {
      label: t("details.occupation"),
      value: profile.occupationKey ? t(`occupations.${profile.occupationKey}`) : t("values.notProvided"),
    },
    {
      label: t("details.steps"),
      value: profile.averageStepsPerDay
        ? t("values.steps", { count: integerFormatter.format(profile.averageStepsPerDay) })
        : t("values.notProvided"),
    },
    {
      label: t("details.goal"),
      value: goalValue,
    },
    { label: t("details.package"), value: profile.memberPackage ? packageT(profile.memberPackage) : t("values.notProvided") },
  ];

  const renderCourse = (courseId: string, badge: string) => {
    const course = getCourseMeta(courseId);

    return (
      <motion.article key={courseId} className={styles.courseItem} variants={fadeUp} whileHover={{ y: -4 }}>
        <div>
          <h3 className={styles.courseName}>{isKnownCourse(courseId) ? courseT(courseId) : courseId}</h3>
          <p className={styles.courseMeta}>
            {course?.durationMinutes ? t("courseMeta.duration", { count: course.durationMinutes }) : t("courseMeta.flexible")}
            {course?.packageRequired ? ` / ${packageT(course.packageRequired)}` : ""}
          </p>
        </div>
        <span className={styles.courseBadge}>{badge}</span>
      </motion.article>
    );
  };

  const renderCourseList = (courseIds: string[], badge: string) => {
    if (courseIds.length === 0) {
      return <p className={styles.recommendationNote}>{t("courseMeta.empty")}</p>;
    }

    return courseIds.map((courseId) => renderCourse(courseId, badge));
  };

  const getDeleteErrorMessage = (error: unknown) => {
    const code = (error as AuthError | undefined)?.code;

    switch (code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return t("delete.errors.invalidPassword");
      case "auth/requires-recent-login":
        return t("delete.errors.recentLogin");
      case "permission-denied":
      case "firestore/permission-denied":
        return t("delete.errors.permissionDenied");
      default:
        return t("delete.errors.generic");
    }
  };

  const handleDeleteProfile = async () => {
    if (!user?.email || !deletePassword || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      setIsDeleteOpen(false);
      setDeletePassword("");
      router.replace(`/${locale}`);
    } catch (error) {
      setDeleteError(getDeleteErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.section
      className={styles.profileSection}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      <div className={styles.shell}>
        <div className={styles.hero}>
          <motion.div className={styles.identityPanel} variants={fadeUp}>
            <div>
              <div
                className={styles.avatar}
                role="img"
                aria-label={t("avatarAlt", { name: displayName })}
                style={avatar ? { backgroundImage: `url("${avatar}")` } : undefined}
              >
                {avatar ? null : profileInitial}
              </div>
              <p className={styles.eyebrow}>{t("eyebrow")}</p>
              <h1 className={styles.title}>{displayName}</h1>
              <p className={styles.email}>{email}</p>
            </div>
            <div className={styles.statusBadge}>
              <ClipboardList size={16} />
              {t(`anamnesisStatus.${profile.anamnesisStatusKey}`)}
            </div>
          </motion.div>

          <motion.div className={styles.metricPanel} variants={fadeUp}>
            <div className={`${styles.metricCard} ${styles.metricCardAccent}`}>
              <p className={styles.metricLabel}>{t("metrics.weight")}</p>
              <p className={styles.metricValue}>{profile.weightKg ? t("values.weight", { count: profile.weightKg }) : t("values.notProvided")}</p>
              <p className={styles.metricHint}>{t("metrics.weightHint")}</p>
            </div>
            <div className={`${styles.metricCard} ${styles.metricCardAccent}`}>
              <p className={styles.metricLabel}>{t("metrics.bmi")}</p>
              <p className={styles.metricValue}>{bmi ? numberFormatter.format(bmi) : t("values.notProvided")}</p>
              <p className={styles.metricHint}>{t("metrics.bmiHint")}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>{t("metrics.started")}</p>
              <p className={styles.metricValue}>{profile.startedCourseIds.length}</p>
              <p className={styles.metricHint}>{t("metrics.startedHint")}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>{t("metrics.completed")}</p>
              <p className={styles.metricValue}>{profile.completedCourseIds.length}</p>
              <p className={styles.metricHint}>{t("metrics.completedHint")}</p>
            </div>
          </motion.div>
        </div>

        <div className={styles.contentGrid}>
          <motion.section className={styles.panel} variants={fadeUp}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>{t("sections.personal.eyebrow")}</p>
                <h2 className={styles.panelTitle}>{t("sections.personal.title")}</h2>
              </div>
              <UserRound className={styles.panelIcon} size={22} />
            </div>
            <div className={styles.detailsGrid}>
              {personalDetails.map((item) => (
                <div key={item.label} className={styles.detailItem}>
                  <p className={styles.detailLabel}>{item.label}</p>
                  <p className={styles.detailValue}>{item.value}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <div className={styles.stack}>
            <motion.section className={styles.panel} variants={fadeUp}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.panelEyebrow}>{t("sections.started.eyebrow")}</p>
                  <h2 className={styles.panelTitle}>{t("sections.started.title")}</h2>
                </div>
                <Activity className={styles.panelIcon} size={22} />
              </div>
              <div className={styles.courseList}>
                {renderCourseList(profile.startedCourseIds, t("badges.started"))}
              </div>
            </motion.section>

            <motion.section className={styles.panel} variants={fadeUp}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.panelEyebrow}>{t("sections.completed.eyebrow")}</p>
                  <h2 className={styles.panelTitle}>{t("sections.completed.title")}</h2>
                </div>
                <CheckCircle2 className={styles.panelIcon} size={22} />
              </div>
              <div className={styles.courseList}>
                {renderCourseList(profile.completedCourseIds, t("badges.completed"))}
              </div>
            </motion.section>
          </div>

          <motion.section className={styles.recommendationPanel} variants={fadeUp}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>{t("sections.recommended.eyebrow")}</p>
                <h2 className={styles.panelTitle}>{t("sections.recommended.title")}</h2>
              </div>
              <Sparkles className={styles.panelIcon} size={22} />
            </div>
            <div className={styles.courseList}>
              {renderCourseList(profile.recommendedCourseIds, t("badges.recommended"))}
            </div>
            <p className={styles.recommendationNote}>{t("sections.recommended.note")}</p>
          </motion.section>

          <motion.section className={styles.panel} variants={fadeUp}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>{t("sections.anamnesis.eyebrow")}</p>
                <h2 className={styles.panelTitle}>{t("sections.anamnesis.title")}</h2>
              </div>
              <HeartPulse className={styles.panelIcon} size={22} />
            </div>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <p className={styles.detailLabel}>
                  <Scale size={14} />
                  {t("details.weight")}
                </p>
                <p className={styles.detailValue}>{profile.weightKg ? t("values.weight", { count: profile.weightKg }) : t("values.notProvided")}</p>
              </div>
              <div className={styles.detailItem}>
                <p className={styles.detailLabel}>
                  <Ruler size={14} />
                  {t("details.height")}
                </p>
                <p className={styles.detailValue}>{profile.heightCm ? t("values.height", { count: profile.heightCm }) : t("values.notProvided")}</p>
              </div>
            </div>
            <p className={styles.recommendationNote}>{t("sections.anamnesis.note")}</p>
          </motion.section>

          <motion.section className={`${styles.panel} ${styles.dangerPanel}`} variants={fadeUp}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>{t("delete.eyebrow")}</p>
                <h2 className={styles.panelTitle}>{t("delete.title")}</h2>
              </div>
              <AlertTriangle className={styles.dangerIcon} size={22} />
            </div>
            <p className={styles.dangerText}>{t("delete.description")}</p>
            <button type="button" className={styles.deleteButton} onClick={() => setIsDeleteOpen(true)}>
              <Trash2 size={17} />
              {t("delete.open")}
            </button>
          </motion.section>
        </div>
      </div>

      {isDeleteOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal} role="dialog" aria-modal="true" aria-labelledby="delete-profile-title">
            <button
              type="button"
              className={styles.modalClose}
              aria-label={t("delete.cancel")}
              onClick={() => {
                setIsDeleteOpen(false);
                setDeletePassword("");
                setDeleteError("");
              }}
            >
              <X size={18} />
            </button>
            <div className={styles.modalIcon}>
              <AlertTriangle size={24} />
            </div>
            <p className={styles.panelEyebrow}>{t("delete.confirmEyebrow")}</p>
            <h2 id="delete-profile-title" className={styles.modalTitle}>{t("delete.confirmTitle")}</h2>
            <p className={styles.modalText}>{t("delete.confirmText")}</p>
            <label className={styles.passwordLabel}>
              <span>{t("delete.passwordLabel")}</span>
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder={t("delete.passwordPlaceholder")}
                autoComplete="current-password"
              />
            </label>
            {deleteError ? <p className={styles.deleteError}>{deleteError}</p> : null}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
              >
                {t("delete.cancel")}
              </button>
              <button
                type="button"
                className={styles.confirmDeleteButton}
                disabled={!deletePassword || isDeleting}
                onClick={handleDeleteProfile}
              >
                {isDeleting ? t("delete.deleting") : t("delete.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}
