"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Baby,
  BriefcaseBusiness,
  CalendarDays,
  Dumbbell,
  Flame,
  HeartPulse,
  Leaf,
  Salad,
  ShieldCheck,
  Video,
} from "lucide-react";
import { memberCourses } from "@/data";
import type { CourseSummary } from "@/lib/contentful";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import styles from "./Courses.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const categoryOrder = [
  "reha",
  "healthy-living",
  "overweight",
  "intensive",
  "pre-post-birth",
  "corporate-fitness",
  "live-courses",
  "live-seminars",
  "nutrition-seminars",
] as const;

type CategoryId = (typeof categoryOrder)[number];

const categoryAliases: Record<string, CategoryId> = {
  reha: "reha",
  rehab: "reha",
  rehabilitation: "reha",
  "reha-kursevi": "reha",
  "healthy-living": "healthy-living",
  "lebe-gesund": "healthy-living",
  "lebe-gesund-kursevi": "healthy-living",
  overweight: "overweight",
  "weight-reduction": "overweight",
  "weight-loss": "overweight",
  abnehmen: "overweight",
  uebergewicht: "overweight",
  ubergewicht: "overweight",
  uebergewichtskurse: "overweight",
  ubergewichtskurse: "overweight",
  intensive: "intensive",
  definition: "intensive",
  "pre-post-birth": "pre-post-birth",
  "pre-postgeburt": "pre-post-birth",
  "pre-and-post-birth": "pre-post-birth",
  firmenfitness: "corporate-fitness",
  "corporate-fitness": "corporate-fitness",
  "live-kursevi": "live-courses",
  "live-courses": "live-courses",
  "live-kurse": "live-courses",
  "live-seminare": "live-seminars",
  "live-seminars": "live-seminars",
  ehrnaehrungsseminare: "nutrition-seminars",
  ernahrungsseminare: "nutrition-seminars",
  ernaehrungsseminare: "nutrition-seminars",
  "nutrition-seminars": "nutrition-seminars",
};

const categoryIcons: Record<CategoryId, typeof HeartPulse> = {
  reha: HeartPulse,
  "healthy-living": Leaf,
  overweight: Salad,
  intensive: Flame,
  "pre-post-birth": Baby,
  "corporate-fitness": BriefcaseBusiness,
  "live-courses": CalendarDays,
  "live-seminars": Video,
  "nutrition-seminars": Salad,
};

function canonicalCategory(categoryKey: unknown): CategoryId {
  const key = Array.isArray(categoryKey) ? categoryKey[0] : categoryKey;

  if (typeof key !== "string") return "healthy-living";

  return categoryAliases[key] ?? "healthy-living";
}

function groupCourses(courses: CourseSummary[]) {
  const grouped = new Map<CategoryId, CourseSummary[]>(
    categoryOrder.map((categoryId) => [categoryId, []]),
  );

  courses.forEach((course) => {
    const categoryId = canonicalCategory(course.categoryKey);
    grouped.get(categoryId)?.push(course);
  });

  return categoryOrder.map((categoryId) => ({
    id: categoryId,
    courses: grouped.get(categoryId) ?? [],
  }));
}

export default function CoursesClient({ courses }: { courses: CourseSummary[] }) {
  const t = useTranslations("courses");
  const courseT = useTranslations("courseCatalog");
  const { user, openAuth } = useAuth();
  const locale = useLocale();
  const groupedCourses = groupCourses(courses);

  return (
    <section className={styles.coursesSection}>
      <motion.header
        className={`${styles.hero} ${styles.mobileHiddenHeader}`}
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div className={styles.heroCopy} variants={fadeUp}>
          <div className={styles.heroStatus}>
            {user ? <ShieldCheck size={15} /> : <Dumbbell size={15} />}
            {user ? t("labels.memberAccess") : t("labels.publicAccess")}
          </div>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.intro}>{t("intro")}</p>
        </motion.div>

        <motion.aside className={styles.unlockPanel} variants={fadeUp}>
          <p className={styles.unlockLabel}>{t("weeklyUnlock.label")}</p>
          <strong>{t("weeklyUnlock.title")}</strong>
          <p>{t("weeklyUnlock.description")}</p>
        </motion.aside>
      </motion.header>

      <motion.div className={styles.categoryGrid} initial="hidden" animate="visible" variants={stagger}>
        {groupedCourses.map((group) => {
          const Icon = categoryIcons[group.id];
          const subtypes = memberCourses.filter((course) => canonicalCategory(course.categoryKey) === group.id);
          const hasCourses = subtypes.length > 0 || group.courses.length > 0;

          return (
            <motion.article key={group.id} variants={fadeUp}>
              {hasCourses ? (
                <Link href={`/${locale}/courses/${group.id}`} className={styles.categoryBlock}>
                  <div className={styles.categoryHead}>
                    <div className={styles.categoryIcon}>
                      <Icon size={19} />
                    </div>
                    <div>
                      <h2 className={styles.categoryTitle}>{t(`courseTypes.categories.${group.id}.title`)}</h2>
                    </div>
                  </div>

                  <div className={styles.subtypePills}>
                    {subtypes.map((course) => (
                      <span key={course.id}>{courseT(course.id)}</span>
                    ))}
                  </div>
                </Link>
              ) : (
                <section className={styles.categoryBlock}>
                  <div className={styles.categoryHead}>
                    <div className={styles.categoryIcon}>
                      <Icon size={19} />
                    </div>
                    <div>
                      <h2 className={styles.categoryTitle}>{t(`courseTypes.categories.${group.id}.title`)}</h2>
                      <p className={styles.categoryDescription}>
                        {t(`courseTypes.categories.${group.id}.description`)}
                      </p>
                    </div>
                  </div>
                  <p className={styles.emptyCategory}>{t("courseTypes.emptyCategory")}</p>
                </section>
              )}
            </motion.article>
          );
        })}
      </motion.div>

      {!user ? (
        <div className={styles.memberCallout}>
          <MemberAccessCallout onSignIn={openAuth} />
        </div>
      ) : null}
    </section>
  );
}
