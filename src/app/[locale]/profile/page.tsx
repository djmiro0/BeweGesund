"use client";

import { signOut } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Award,
  ChevronDown,
  Crown,
  Dumbbell,
  HeartPulse,
  LogOut,
  Medal,
  PersonStanding,
  Ruler,
  Scale,
  Sparkles,
  Trophy,
  UserRound,
  Wind,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { auth, db } from "../../../../firebase.config";
import { emptyUserProfile, getAuthUserPhotoURL, getProfileFirstName } from "@/lib/userProfile";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import BillingActions from "./BillingActions";
import ProfileSettingsAccess from "./ProfileSettingsAccess";
import ProfileAvatar from "@/app/components/ProfileAvatar/ProfileAvatar";
import WearableIntegration from "./WearableIntegration";
import styles from "./Profile.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

type ProfileSection = "membership" | "health" | "body" | "badges";

const translatedGoalKeys = ["backPain"];
const recommendedBmiMax = 24.9;
const recommendedBmiMin = 18.5;
const pointsPerBadgeLevel = 600;

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  regionKey: string;
  score: number;
}

interface LeaderboardState {
  regionKey: string | null;
  entries: LeaderboardEntry[];
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const authT = useTranslations("auth");
  const packageT = useTranslations("packages");
  const locale = useLocale();
  const { user, profile: firebaseProfile, openAuth } = useAuth();
  const profile = firebaseProfile ?? emptyUserProfile;
  const [openSection, setOpenSection] = useState<ProfileSection | null>(null);
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>({
    regionKey: null,
    entries: [],
  });

  useEffect(() => {
    if (!user || !profile.regionKey) {
      return undefined;
    }

    const entriesQuery = query(
      collection(db, "leaderboards", "weekly", "regions", profile.regionKey, "entries"),
      orderBy("score", "desc"),
      limit(20),
    );

    return onSnapshot(
      entriesQuery,
      (snapshot) => {
        const entries = snapshot.docs.map((document) => {
          const data = document.data();
          const displayName = typeof data.displayName === "string" && data.displayName.trim()
            ? data.displayName.trim()
            : t("values.notProvided");
          const regionKey = typeof data.regionKey === "string" && data.regionKey.trim()
            ? data.regionKey
            : profile.regionKey ?? "";
          const score = typeof data.score === "number" && Number.isFinite(data.score) ? data.score : 0;

          return {
            userId: document.id,
            displayName,
            regionKey,
            score,
          };
        });

        setLeaderboardState({ regionKey: profile.regionKey, entries });
      },
      () => {
        setLeaderboardState({ regionKey: profile.regionKey, entries: [] });
      },
    );
  }, [profile.regionKey, t, user]);

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
  const avatar = getAuthUserPhotoURL(user) || profile.photoURL;
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
  const currentBadgePoints = profile.points % pointsPerBadgeLevel;
  const pointsToNextBadge = pointsPerBadgeLevel - currentBadgePoints;
  const badgeProgress = Math.min(100, Math.round((currentBadgePoints / pointsPerBadgeLevel) * 100));
  const leaderboardEntries = profile.regionKey === leaderboardState.regionKey ? leaderboardState.entries : [];
  const leaderboardLoading = Boolean(profile.regionKey && profile.regionKey !== leaderboardState.regionKey);
  const leaderboardWithCurrentUser = leaderboardEntries.some((entry) => entry.userId === user.uid)
    ? leaderboardEntries
    : [
      ...leaderboardEntries,
      {
        userId: user.uid,
        displayName: firstName,
        regionKey: profile.regionKey ?? "",
        score: profile.weeklyScore,
      },
    ].sort((left, right) => right.score - left.score);

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
          <ProfileAvatar
            userId={user.uid}
            photoUrl={avatar}
            initial={profileInitial}
            className={styles.avatar}
            ariaLabel={t("avatarAlt", { name: firstName })}
          />
          <div className={styles.identityText}>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1 className={styles.title}>{firstName}</h1>
            <p className={styles.email}>{email}</p>
          </div>
          <ProfileSettingsAccess
            locale={locale}
            openLabel={t("settings.open")}
          />
        </motion.header>

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

        <motion.details
          className={`${styles.mobileCard} ${styles.healthCard}`}
          variants={fadeUp}
          open={openSection === "health"}
          onToggle={(event) => handleSectionToggle("health", event.currentTarget.open)}
        >
          <summary className={styles.cardSummary}>
            <span>{t("wearables.title")}</span>
            <HeartPulse size={30} />
            <ChevronDown className={styles.chevron} size={19} />
          </summary>
          <div className={styles.expandedBlock}>
            <WearableIntegration locale={locale} />
          </div>
        </motion.details>
        <motion.details
            className={`${styles.mobileCard} ${styles.packageCard}`}
            variants={fadeUp}
            open={openSection === "membership"}
            onToggle={(event) => handleSectionToggle("membership", event.currentTarget.open)}
        >
          <summary className={styles.cardSummary}>
            <span>{t("packageSelector.title")}</span>
            <Crown size={30} />
            <ChevronDown className={styles.chevron} size={19} />
          </summary>
          <div className={styles.expandedBlock}>
            <div className={styles.sectionIntro}>
              <p className={styles.panelEyebrow}>{t("packageSelector.eyebrow")}</p>
              <h2>{t("packageSelector.title")}</h2>
              <p>{t("packageSelector.description")}</p>
            </div>
            <BillingActions
                locale={locale}
                memberPackage={profile.memberPackage}
                subscriptionStatus={profile.subscriptionStatus}
                basicName={packageT("basic")}
                plusName={packageT("plus")}
                basicPrice={t("packageSelector.basicPrice")}
                plusPrice={t("packageSelector.plusPrice")}
                basicCheckoutLabel={t("packageSelector.subscribeBasic")}
                plusCheckoutLabel={t("packageSelector.subscribePlus")}
                upgradeLabel={t("packageSelector.upgrade")}
                downgradeLabel={t("packageSelector.downgrade")}
                manageLabel={t("packageSelector.manage")}
                processingLabel={t("packageSelector.processing")}
                errorLabel={t("packageSelector.billingError")}
                currentLabel={t("packageSelector.currentPackage")}
                inactiveLabel={t("packageSelector.inactive")}
                activeLabel={t("packageSelector.active")}
                selectedLabel={t("packageSelector.selected")}
                statusLabel={t("packageSelector.status")}
            />
            <p className={styles.packageHint}>{t("packageSelector.billingHint")}</p>
          </div>
        </motion.details>

        <div className={styles.twoColumnRow}>
          <motion.div
            className={`${styles.mobileCard} ${styles.trainingCard} ${styles.linkCard}`}
            variants={fadeUp}
          >
            <Link href={`/${locale}/courses`} className={styles.cardSummary}>
              <span>{t("cards.training.title")}</span>
              <Dumbbell size={30} />
            </Link>
          </motion.div>

          <motion.div
            className={`${styles.mobileCard} ${styles.calmCard} ${styles.linkCard}`}
            variants={fadeUp}
          >
            <Link href={`/${locale}/meditation-relaxation`} className={styles.cardSummary}>
              <span>{t("cards.calm.title")}</span>
              <Wind size={30} />
            </Link>
          </motion.div>
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
                <p>{t("cards.badges.next", { count: pointsToNextBadge })}</p>
              </div>
            </div>
            <div className={styles.pointsGrid}>
              <div>
                <span>{t("points.total")}</span>
                <strong>{integerFormatter.format(profile.points)}</strong>
              </div>
              <div>
                <span>{t("points.xp")}</span>
                <strong>{integerFormatter.format(profile.xp)}</strong>
              </div>
              <div>
                <span>{t("points.weekly")}</span>
                <strong>{integerFormatter.format(profile.weeklyScore)}</strong>
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
            {profile.regionKey && !leaderboardLoading && leaderboardWithCurrentUser.length === 0 ? (
              <p className={styles.leaderboardState}>{t("leaderboard.empty")}</p>
            ) : null}
            {!profile.regionKey ? (
              <p className={styles.leaderboardState}>{t("leaderboard.noRegion")}</p>
            ) : null}
            {leaderboardLoading ? (
              <p className={styles.leaderboardState}>{t("leaderboard.loading")}</p>
            ) : null}
            {!leaderboardLoading && profile.regionKey ? leaderboardWithCurrentUser.map((entry, index) => (
              <div
                key={entry.userId}
                className={`${styles.leaderboardRow} ${entry.userId === user.uid ? styles.currentUserRow : ""}`}
              >
                <span className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ""}`}>
                  {index + 1}
                </span>
                <span className={styles.competitor}>
                  <strong>
                    {entry.displayName}
                    {index < 3 ? <Crown size={14} aria-label={t("leaderboard.champion")} /> : null}
                  </strong>
                  <small>
                    {entry.userId === user.uid
                      ? t("leaderboard.you")
                      : authT(`regions.${entry.regionKey}`)}
                  </small>
                </span>
                <strong className={styles.points}>{integerFormatter.format(entry.score)}</strong>
              </div>
            )) : null}
          </div>
          <p className={styles.leaderboardNote}>{t("leaderboard.note")}</p>
        </motion.section>

        <motion.section className={styles.accountPanel} variants={fadeUp}>
          <div>
            <p className={styles.panelEyebrow}>{t("account.eyebrow")}</p>
            <h2>{t("account.title")}</h2>
            <p>{t("account.description")}</p>
          </div>
          <button
            type="button"
            className={styles.profileSignOutButton}
            onClick={() => void signOut(auth)}
          >
            <LogOut size={18} />
            {t("account.signOut")}
          </button>
        </motion.section>
      </div>

    </motion.section>
  );
}
