"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  Dumbbell,
  HeartPulse,
  Medal,
  PersonStanding,
  Ruler,
  Scale,
  Sparkles,
  Trophy,
  Trash2,
  UserRound,
  Wind,
  X,
} from "lucide-react";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, type AuthError } from "firebase/auth";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase.config";
import { activeScheduleDays, memberCourses, type MemberPackage } from "@/data";
import { memberPackages } from "@/lib/memberPackages";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import ProfileSettingsAccess from "./ProfileSettingsAccess";
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
const recommendedBmiMax = 24.9;
const recommendedBmiMin = 18.5;

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
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [packageMessage, setPackageMessage] = useState("");

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
  const heightMeters = profile.heightCm ? profile.heightCm / 100 : null;
  const recommendedWeightMin = heightMeters ? recommendedBmiMin * heightMeters * heightMeters : null;
  const recommendedWeightMax = heightMeters ? recommendedBmiMax * heightMeters * heightMeters : null;
  const flexibleWeightMax = recommendedWeightMax ? recommendedWeightMax * 1.1 : null;
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

  const recommendedWeightValue = recommendedWeightMin && recommendedWeightMax
    ? t("values.weightRange", {
      min: numberFormatter.format(recommendedWeightMin),
      max: numberFormatter.format(recommendedWeightMax),
    })
    : t("values.notProvided");
  const flexibleWeightValue = flexibleWeightMax
    ? t("values.weight", { count: numberFormatter.format(flexibleWeightMax) })
    : t("values.notProvided");
  const bodyDetails = [
    {
      label: t("details.weight"),
      value: profile.weightKg ? t("values.weight", { count: profile.weightKg }) : t("values.notProvided"),
      icon: Scale,
    },
    {
      label: t("details.height"),
      value: profile.heightCm ? t("values.height", { count: profile.heightCm }) : t("values.notProvided"),
      icon: Ruler,
    },
    {
      label: t("metrics.bmi"),
      value: bmi ? numberFormatter.format(bmi) : t("values.notProvided"),
      icon: Activity,
    },
    {
      label: t("details.recommendedWeight"),
      value: recommendedWeightValue,
      icon: HeartPulse,
    },
    {
      label: t("details.flexibleWeight"),
      value: flexibleWeightValue,
      icon: Sparkles,
    },
    {
      label: t("details.dateOfBirth"),
      value: profile.dateOfBirth ? dateFormatter.format(new Date(profile.dateOfBirth)) : t("values.notProvided"),
      icon: UserRound,
    },
    {
      label: t("details.occupation"),
      value: profile.occupationKey ? t(`occupations.${profile.occupationKey}`) : t("values.notProvided"),
      icon: PersonStanding,
    },
    {
      label: t("details.steps"),
      value: profile.averageStepsPerDay
        ? t("values.steps", { count: integerFormatter.format(profile.averageStepsPerDay) })
        : t("values.notProvided"),
      icon: Activity,
    },
    {
      label: t("details.goal"),
      value: goalValue,
      icon: Trophy,
    },
    {
      label: t("details.package"),
      value: profile.memberPackage ? packageT(profile.memberPackage) : t("values.notProvided"),
      icon: Crown,
    },
  ];
  const livePremiumItems = activeScheduleDays.flatMap((day) => day.entries.map((entry) => ({
    id: `${day.id}-${entry.id}`,
    titleKey: entry.titleKey,
    formatKey: entry.formatKey,
    packageRequired: entry.packageRequired,
  })));
  const calmItems = [
    { label: t("calm.meditation"), icon: Sparkles },
    { label: t("calm.breathTraining"), icon: Wind },
    { label: t("calm.breathSimulation"), icon: Activity },
    { label: t("calm.journal"), icon: BookOpen },
  ];
  const currentBadgePoints = 420;
  const nextBadgePoints = 600;
  const badgeProgress = Math.round((currentBadgePoints / nextBadgePoints) * 100);

  const renderCourse = (courseId: string, badge: string) => {
    const course = getCourseMeta(courseId);

    return (
      <article key={courseId} className={styles.courseItem}>
        <div>
          <h3 className={styles.courseName}>{isKnownCourse(courseId) ? courseT(courseId) : courseId}</h3>
          <p className={styles.courseMeta}>
            {course?.durationMinutes ? t("courseMeta.duration", { count: course.durationMinutes }) : t("courseMeta.flexible")}
            {course?.packageRequired ? ` / ${packageT(course.packageRequired)}` : ""}
          </p>
        </div>
        <span className={styles.courseBadge}>{badge}</span>
      </article>
    );
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

  const handlePackageChange = async (nextPackage: MemberPackage) => {
    if (!user || nextPackage === profile.memberPackage || isSavingPackage) return;

    const previousPackage = profile.memberPackage;
    setIsSavingPackage(true);
    setPackageMessage("");
    setProfile((current) => ({ ...current, memberPackage: nextPackage }));

    try {
      await updateDoc(doc(db, "users", user.uid), {
        memberPackage: nextPackage,
        updatedAt: serverTimestamp(),
      });
      setPackageMessage(t("packageSelector.saved"));
    } catch {
      setProfile((current) => ({ ...current, memberPackage: previousPackage }));
      setPackageMessage(t("packageSelector.error"));
    } finally {
      setIsSavingPackage(false);
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
        <motion.header className={styles.mobileHeader} variants={fadeUp}>
          <div
            className={styles.avatar}
            role="img"
            aria-label={t("avatarAlt", { name: displayName })}
            style={avatar ? { backgroundImage: `url("${avatar}")` } : undefined}
          >
            {avatar ? null : profileInitial}
          </div>
          <div className={styles.identityText}>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1 className={styles.title}>{displayName}</h1>
            <p className={styles.email}>{email}</p>
          </div>
          <ProfileSettingsAccess
            locale={locale}
            openLabel={t("settings.open")}
            closeLabel={t("settings.close")}
            title={t("settings.title")}
            description={t("settings.description")}
            settingsLabel={t("settings.link")}
          />
        </motion.header>

        <motion.section className={styles.packagePanel} variants={fadeUp}>
          <div>
            <p className={styles.panelEyebrow}>{t("packageSelector.eyebrow")}</p>
            <h2>{t("packageSelector.title")}</h2>
            <p>{t("packageSelector.description")}</p>
          </div>
          <div className={styles.packageOptions}>
            {memberPackages.map((packageId) => {
              const isSelected = profile.memberPackage === packageId;

              return (
                <button
                  key={packageId}
                  type="button"
                  className={`${styles.packageOption} ${isSelected ? styles.packageOptionActive : ""}`}
                  aria-pressed={isSelected}
                  disabled={isSavingPackage}
                  onClick={() => void handlePackageChange(packageId)}
                >
                  <span>{packageT(packageId)}</span>
                  {isSelected ? <Check size={17} /> : null}
                </button>
              );
            })}
          </div>
          <p className={styles.packageHint}>{packageMessage || t("packageSelector.temporaryHint")}</p>
        </motion.section>

        <motion.details className={`${styles.mobileCard} ${styles.bodyCard}`} variants={fadeUp} open>
          <summary className={styles.cardSummary}>
            <span>{t("cards.body.title")}</span>
            <Scale size={34} />
            <ChevronDown className={styles.chevron} size={20} />
          </summary>
          <div className={styles.bodyPreview}>
            {bodyDetails.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={styles.iconLine}>
                  <Icon size={26} />
                  <p>
                    <span>{item.label}</span>
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
          <div className={styles.expandedBlock}>
            {bodyDetails.slice(4).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={styles.detailRow}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              );
            })}
            <p className={styles.note}>{t("cards.body.note")}</p>
          </div>
        </motion.details>

        <div className={styles.twoColumnRow}>
          <motion.details className={`${styles.mobileCard} ${styles.trainingCard}`} variants={fadeUp}>
            <summary className={styles.cardSummary}>
              <span>{t("cards.training.title")}</span>
              <Dumbbell size={30} />
              <ChevronDown className={styles.chevron} size={19} />
            </summary>
            <div className={styles.compactMedia}>
              <PersonStanding size={52} />
              <div>
                <h3>{t("cards.training.summaryTitle")}</h3>
                <p>{t("cards.training.summaryText")}</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.moreButton}
              onClick={() => setIsTrainingOpen(true)}
            >
              {t("actions.seeMore")}
            </button>
          </motion.details>

          <motion.details className={`${styles.mobileCard} ${styles.calmCard}`} variants={fadeUp}>
            <summary className={styles.cardSummary}>
              <span>{t("cards.calm.title")}</span>
              <Wind size={30} />
              <ChevronDown className={styles.chevron} size={19} />
            </summary>
            <div className={styles.calmList}>
              {calmItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={styles.calmItem}>
                    <Icon size={22} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.breathCircle}>
              <span>{t("cards.calm.breathe")}</span>
            </div>
          </motion.details>
        </div>

        <div className={styles.twoColumnRow}>
          <motion.details className={`${styles.mobileCard} ${styles.badgeCard}`} variants={fadeUp}>
            <summary className={styles.cardSummary}>
              <span>{t("cards.badges.title")}</span>
              <Medal size={30} />
              <ChevronDown className={styles.chevron} size={19} />
            </summary>
            <div className={styles.badgeBody}>
              <Award size={42} />
              <div>
                <h3>{t("cards.badges.current")}</h3>
                <p>{t("cards.badges.next", { count: nextBadgePoints - currentBadgePoints })}</p>
              </div>
            </div>
            <div className={styles.progressTrack}>
              <span style={{ width: `${badgeProgress}%` }} />
            </div>
          </motion.details>

          <motion.details className={`${styles.mobileCard} ${styles.leagueCard}`} variants={fadeUp}>
            <summary className={styles.cardSummary}>
              <span>{t("cards.league.title")}</span>
              <Trophy size={30} />
              <ChevronDown className={styles.chevron} size={19} />
            </summary>
            <div className={styles.leagueBody}>
              <CalendarDays size={38} />
              <div>
                <h3>{t("cards.league.subtitle")}</h3>
                <p>{t("cards.league.description")}</p>
              </div>
            </div>
          </motion.details>
        </div>

        <motion.section className={`${styles.mobileCard} ${styles.dangerPanel}`} variants={fadeUp}>
          <div className={styles.staticHeader}>
            <div>
              <p className={styles.panelEyebrow}>{t("delete.eyebrow")}</p>
              <h2>{t("delete.title")}</h2>
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

      {isTrainingOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.trainingModal} role="dialog" aria-modal="true" aria-labelledby="training-modal-title">
            <button
              type="button"
              className={styles.modalClose}
              aria-label={t("actions.closeTraining")}
              onClick={() => setIsTrainingOpen(false)}
            >
              <X size={18} />
            </button>
            <div className={styles.trainingModalHeader}>
              <Dumbbell size={28} />
              <div>
                <p className={styles.panelEyebrow}>{t("cards.training.title")}</p>
                <h2 id="training-modal-title">{t("cards.training.modalTitle")}</h2>
                <p>{t("cards.training.modalDescription")}</p>
              </div>
            </div>

            <div className={styles.trainingModalContent}>
              <section className={styles.trainingModalSection}>
                <h3>{t("cards.training.allCourses")}</h3>
                <div className={styles.modalCourseGrid}>
                  {memberCourses.map((course) => renderCourse(course.id, packageT(course.packageRequired)))}
                </div>
              </section>

              <section className={styles.trainingModalSection}>
                <h3>{t("cards.training.premiumTitle")}</h3>
                <div className={styles.modalCourseGrid}>
                  {livePremiumItems.map((item) => (
                    <article key={item.id} className={styles.courseItem}>
                      <div>
                        <h3 className={styles.courseName}>{courseT(item.titleKey)}</h3>
                        <p className={styles.courseMeta}>
                          {t(`liveFormats.${item.formatKey}`)} / {packageT(item.packageRequired)}
                        </p>
                      </div>
                      <span className={`${styles.courseBadge} ${styles.premiumBadge}`}>{t("badges.premium")}</span>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

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
