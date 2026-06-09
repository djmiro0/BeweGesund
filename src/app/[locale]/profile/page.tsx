"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Award,
  BookOpen,
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
  UserRound,
  Wind,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { activeScheduleDays, memberCourses } from "@/data";
import { memberPackages } from "@/lib/memberPackages";
import { emptyUserProfile, getProfileFirstName } from "@/lib/userProfile";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import ProfileSettingsAccess from "./ProfileSettingsAccess";
import styles from "./Profile.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const getCourseMeta = (courseId: string) => memberCourses.find((course) => course.id === courseId);

type ProfileSection = "body" | "training" | "calm" | "badges";

const isKnownCourse = (courseId: string) => memberCourses.some((course) => course.id === courseId);
const translatedGoalKeys = ["backPain"];
const recommendedBmiMax = 24.9;
const recommendedBmiMin = 18.5;

export default function ProfilePage() {
  const t = useTranslations("profile");
  const authT = useTranslations("auth");
  const courseT = useTranslations("courseCatalog");
  const packageT = useTranslations("packages");
  const locale = useLocale();
  const { user, profile: firebaseProfile, openAuth } = useAuth();
  const profile = firebaseProfile ?? emptyUserProfile;
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [openSection, setOpenSection] = useState<ProfileSection | null>("body");

  if (!user) {
    return (
      <section className={styles.profileSection}>
        <div className={styles.shell}>
          <MemberAccessCallout onSignIn={openAuth} />
        </div>
      </section>
    );
  }

  const firstName = getProfileFirstName(profile, user.displayName) || t("values.notProvided");
  const email = user.email || profile.email || t("values.notProvided");
  const avatar = profile.photoURL || user.photoURL;
  const profileInitial = firstName.charAt(0).toUpperCase();

  const handleSectionToggle = (section: ProfileSection, isOpen: boolean) => {
    setOpenSection((currentSection) => {
      if (isOpen) return section;
      return currentSection === section ? null : currentSection;
    });
  };
  const bmi = profile.heightCm && profile.weightKg
    ? profile.weightKg / ((profile.heightCm / 100) * (profile.heightCm / 100))
    : null;
  const heightMeters = profile.heightCm ? profile.heightCm / 100 : null;
  const recommendedWeightMin = heightMeters ? recommendedBmiMin * heightMeters * heightMeters : null;
  const recommendedWeightMax = heightMeters ? recommendedBmiMax * heightMeters * heightMeters : null;
  const flexibleWeightMax = recommendedWeightMax ? recommendedWeightMax * 1.1 : null;
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
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
      label: t("details.age"),
      value: profile.age ? t("values.age", { count: profile.age }) : t("values.notProvided"),
      icon: UserRound,
    },
    {
      label: t("details.gender"),
      value: profile.gender ? t(`values.gender.${profile.gender}`) : t("values.notProvided"),
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
  const leaderboardEntries = [
    { name: "Mia Weber", region: "Berlin", points: 980 },
    { name: "Jonas Fischer", region: "Bayern", points: 860 },
    { name: "Lea Schneider", region: "Hessen", points: 740 },
    {
      name: firstName,
      region: profile.regionKey ? authT(`regions.${profile.regionKey}`) : t("values.notProvided"),
      points: profile.weeklyScore,
      isCurrentUser: true,
    },
    { name: "Noah Wagner", region: "Hamburg", points: 420 },
    { name: "Emma Becker", region: "Sachsen", points: 310 },
  ].sort((a, b) => b.points - a.points);

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
            aria-label={t("avatarAlt", { name: firstName })}
            style={avatar ? { backgroundImage: `url("${avatar}")` } : undefined}
          >
            {avatar ? null : profileInitial}
          </div>
          <div className={styles.identityText}>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1 className={styles.title}>{firstName}</h1>
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
                  disabled
                >
                  <span>{packageT(packageId)}</span>
                  {isSelected ? <Check size={17} /> : null}
                </button>
              );
            })}
          </div>
          <p className={styles.packageHint}>{t("packageSelector.temporaryHint")}</p>
        </motion.section>

        <motion.details
          className={`${styles.mobileCard} ${styles.bodyCard}`}
          variants={fadeUp}
          open={openSection === "body"}
          onToggle={(event) => handleSectionToggle("body", event.currentTarget.open)}
        >
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
          <motion.details
            className={`${styles.mobileCard} ${styles.trainingCard}`}
            variants={fadeUp}
            open={openSection === "training"}
            onToggle={(event) => handleSectionToggle("training", event.currentTarget.open)}
          >
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

          <motion.details
            className={`${styles.mobileCard} ${styles.calmCard}`}
            variants={fadeUp}
            open={openSection === "calm"}
            onToggle={(event) => handleSectionToggle("calm", event.currentTarget.open)}
          >
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

        <motion.details
          className={`${styles.mobileCard} ${styles.badgeCard}`}
          variants={fadeUp}
          open={openSection === "badges"}
          onToggle={(event) => handleSectionToggle("badges", event.currentTarget.open)}
        >
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

        <motion.section className={styles.leaderboard} variants={fadeUp}>
          <div className={styles.leaderboardGlow} aria-hidden="true" />
          <div className={styles.leaderboardHeader}>
            <div>
              <p className={styles.leaderboardEyebrow}>{t("leaderboard.eyebrow")}</p>
              <h2>{t("leaderboard.title")}</h2>
              <p>{t("leaderboard.description")}</p>
            </div>
            <span className={styles.trophyMark}>
              <Trophy size={30} />
            </span>
          </div>
          <div className={styles.leaderboardTable}>
            <div className={styles.leaderboardLabels} aria-hidden="true">
              <span>{t("leaderboard.rank")}</span>
              <span>{t("leaderboard.competitor")}</span>
              <span>{t("leaderboard.points")}</span>
            </div>
            {leaderboardEntries.map((entry, index) => (
              <div
                key={`${entry.name}-${entry.region}`}
                className={`${styles.leaderboardRow} ${entry.isCurrentUser ? styles.currentUserRow : ""}`}
              >
                <span className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ""}`}>
                  {index + 1}
                </span>
                <span className={styles.competitor}>
                  <strong>{entry.name}</strong>
                  <small>{entry.isCurrentUser ? t("leaderboard.you") : entry.region}</small>
                </span>
                <strong className={styles.points}>{integerFormatter.format(entry.points)}</strong>
              </div>
            ))}
          </div>
          <p className={styles.leaderboardNote}>{t("leaderboard.placeholder")}</p>
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

    </motion.section>
  );
}
