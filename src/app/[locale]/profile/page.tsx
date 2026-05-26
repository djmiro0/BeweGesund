"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, ClipboardList, HeartPulse, Ruler, Scale, Sparkles, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memberCourses, memberDashboard, memberProfile } from "@/data";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import styles from "./Profile.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const getCourseMeta = (courseId: string) => memberCourses.find((course) => course.id === courseId);

export default function ProfilePage() {
  const t = useTranslations("profile");
  const courseT = useTranslations("courseCatalog");
  const packageT = useTranslations("packages");
  const locale = useLocale();
  const { user, openAuth } = useAuth();

  if (!user) {
    return (
      <section className={styles.profileSection}>
        <div className={styles.shell}>
          <MemberAccessCallout onSignIn={openAuth} />
        </div>
      </section>
    );
  }

  const displayName = user.displayName || memberProfile.name;
  const email = user.email || memberProfile.email;
  const avatar = user.photoURL || memberProfile.avatar;
  const heightM = memberProfile.heightCm / 100;
  const bmi = memberProfile.weightKg / (heightM * heightM);
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const personalDetails = [
    { label: t("details.dateOfBirth"), value: dateFormatter.format(new Date(memberProfile.dateOfBirth)) },
    { label: t("details.height"), value: t("values.height", { count: memberProfile.heightCm }) },
    { label: t("details.occupation"), value: t(`occupations.${memberProfile.occupationKey}`) },
    { label: t("details.steps"), value: t("values.steps", { count: integerFormatter.format(memberProfile.averageStepsPerDay) }) },
    { label: t("details.goal"), value: t(`goals.${memberProfile.primaryGoalKey}`) },
    { label: t("details.package"), value: packageT(memberDashboard.package) },
  ];

  const renderCourse = (courseId: string, badge: string) => {
    const course = getCourseMeta(courseId);

    return (
      <motion.article key={courseId} className={styles.courseItem} variants={fadeUp} whileHover={{ y: -4 }}>
        <div>
          <h3 className={styles.courseName}>{courseT(courseId)}</h3>
          <p className={styles.courseMeta}>
            {course?.durationMinutes ? t("courseMeta.duration", { count: course.durationMinutes }) : t("courseMeta.flexible")}
            {course?.packageRequired ? ` / ${packageT(course.packageRequired)}` : ""}
          </p>
        </div>
        <span className={styles.courseBadge}>{badge}</span>
      </motion.article>
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
        <div className={styles.hero}>
          <motion.div className={styles.identityPanel} variants={fadeUp}>
            <div>
              <div
                className={styles.avatar}
                role="img"
                aria-label={t("avatarAlt", { name: displayName })}
                style={{ backgroundImage: `url("${avatar}")` }}
              />
              <p className={styles.eyebrow}>{t("eyebrow")}</p>
              <h1 className={styles.title}>{displayName}</h1>
              <p className={styles.email}>{email}</p>
            </div>
            <div className={styles.statusBadge}>
              <ClipboardList size={16} />
              {t(`anamnesisStatus.${memberProfile.anamnesisStatusKey}`)}
            </div>
          </motion.div>

          <motion.div className={styles.metricPanel} variants={fadeUp}>
            <div className={`${styles.metricCard} ${styles.metricCardAccent}`}>
              <p className={styles.metricLabel}>{t("metrics.weight")}</p>
              <p className={styles.metricValue}>{t("values.weight", { count: memberProfile.weightKg })}</p>
              <p className={styles.metricHint}>{t("metrics.weightHint")}</p>
            </div>
            <div className={`${styles.metricCard} ${styles.metricCardAccent}`}>
              <p className={styles.metricLabel}>{t("metrics.bmi")}</p>
              <p className={styles.metricValue}>{numberFormatter.format(bmi)}</p>
              <p className={styles.metricHint}>{t("metrics.bmiHint")}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>{t("metrics.started")}</p>
              <p className={styles.metricValue}>{memberDashboard.upcomingCourseIds.length}</p>
              <p className={styles.metricHint}>{t("metrics.startedHint")}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>{t("metrics.completed")}</p>
              <p className={styles.metricValue}>{memberDashboard.completedCourseIds.length}</p>
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
                {memberDashboard.upcomingCourseIds.map((courseId) => renderCourse(courseId, t("badges.started")))}
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
                {memberDashboard.completedCourseIds.map((courseId) => renderCourse(courseId, t("badges.completed")))}
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
              {memberDashboard.recommendedCourseIds.map((courseId) => renderCourse(courseId, t("badges.recommended")))}
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
                <p className={styles.detailValue}>{t("values.weight", { count: memberProfile.weightKg })}</p>
              </div>
              <div className={styles.detailItem}>
                <p className={styles.detailLabel}>
                  <Ruler size={14} />
                  {t("details.height")}
                </p>
                <p className={styles.detailValue}>{t("values.height", { count: memberProfile.heightCm })}</p>
              </div>
            </div>
            <p className={styles.recommendationNote}>{t("sections.anamnesis.note")}</p>
          </motion.section>
        </div>
      </div>
    </motion.section>
  );
}
