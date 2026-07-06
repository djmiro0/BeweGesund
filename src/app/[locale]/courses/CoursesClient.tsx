"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
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
import type { CSSProperties } from "react";
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

const categoryVisuals: Partial<Record<CategoryId, {
  accent: string;
  glow: string;
  image: string;
  pillLimit: number;
}>> = {
  reha: {
    accent: "#ff3455",
    glow: "rgba(255, 52, 85, 0.32)",
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 3,
  },
  "healthy-living": {
    accent: "#b5d83d",
    glow: "rgba(181, 216, 61, 0.32)",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
  overweight: {
    accent: "#00c3bd",
    glow: "rgba(0, 195, 189, 0.3)",
    image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
  intensive: {
    accent: "#ff6b1a",
    glow: "rgba(255, 107, 26, 0.3)",
    image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
  "pre-post-birth": {
    accent: "#f25aa5",
    glow: "rgba(242, 90, 165, 0.28)",
    image: "https://images.unsplash.com/photo-1537673156864-5d2c72de7824?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
  "corporate-fitness": {
    accent: "#8b5cf6",
    glow: "rgba(139, 92, 246, 0.3)",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
  "live-courses": {
    accent: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.28)",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
  "live-seminars": {
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.26)",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
  "nutrition-seminars": {
    accent: "#22c55e",
    glow: "rgba(34, 197, 94, 0.26)",
    image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=82&w=1200",
    pillLimit: 2,
  },
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
  const visibleGroups = groupedCourses.filter((group) => {
    const hasSubtypes = memberCourses.some((course) => canonicalCategory(course.categoryKey) === group.id);
    return Boolean(categoryVisuals[group.id]) && (hasSubtypes || group.courses.length > 0 || group.id.includes("seminars"));
  });

  return (
    <section className={`${styles.coursesSection} ${styles.overviewSection}`}>
      <motion.header
        className={`${styles.hero} ${styles.overviewHero}`}
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div className={styles.heroCopy} variants={fadeUp}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.intro}>{t("intro")}</p>
        </motion.div>

        <motion.aside className={`${styles.unlockPanel} ${styles.overviewAccess}`} variants={fadeUp}>
          <div className={styles.heroStatus}>
            {user ? <ShieldCheck size={15} /> : <Dumbbell size={15} />}
            {user ? t("labels.memberAccess") : t("labels.publicAccess")}
          </div>
          <p className={styles.unlockLabel}>{t("weeklyUnlock.label")}</p>
          <strong>{t("weeklyUnlock.title")}</strong>
          <p>{t("weeklyUnlock.description")}</p>
        </motion.aside>
      </motion.header>

      <motion.div className={styles.categoryGrid} initial="hidden" animate="visible" variants={stagger}>
        {visibleGroups.map((group) => {
          const Icon = categoryIcons[group.id];
          const subtypes = memberCourses.filter((course) => canonicalCategory(course.categoryKey) === group.id);
          const hasCourses = subtypes.length > 0 || group.courses.length > 0;
          const visual = categoryVisuals[group.id];
          const pillItems = subtypes.length
            ? subtypes.map((course) => ({ id: course.id, label: courseT(course.id) }))
            : group.courses.map((course) => ({ id: course.id, label: course.title }));
          const visiblePillItems = pillItems.slice(0, visual?.pillLimit ?? 2);
          const hiddenPillCount = Math.max(0, pillItems.length - visiblePillItems.length);
          const categoryStyle = {
            "--category-accent": visual?.accent,
            "--category-glow": visual?.glow,
            "--category-image": `url(${visual?.image})`,
          } as CSSProperties;

          return (
            <motion.article key={group.id} variants={fadeUp}>
              {hasCourses ? (
                <Link href={`/${locale}/courses/${group.id}`} className={styles.categoryBlock} style={categoryStyle}>
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

                  <div className={styles.subtypePills}>
                    {visiblePillItems.map((course) => (
                      <span key={course.id}>{course.label}</span>
                    ))}
                    {hiddenPillCount > 0 ? <span className={styles.pillCount}>+{hiddenPillCount}</span> : null}
                  </div>
                  <span className={styles.categoryArrow} aria-hidden="true">
                    <ArrowRight size={28} />
                  </span>
                </Link>
              ) : (
                <section className={styles.categoryBlock} style={categoryStyle}>
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
