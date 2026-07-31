"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Crown,
  Play,
  PlusCircle,
  Sparkles,
  Timer,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memberCourseCategories } from "@/data";
import type {
  BlogPost,
  CourseSummary,
  MeditationRelaxationItem,
} from "@/lib/contentful";
import { useAuth } from "./AuthProvider";
import { getDashboardProgress } from "@/lib/dashboardProgress";
import ProfileAvatar from "@/app/components/ProfileAvatar/ProfileAvatar";
import styles from "./Dashboard.module.css";

interface DashboardUser {
  name: string;
}

type DashboardWorkout = Omit<CourseSummary, "liveTrainingLink">;
type DashboardPost = Omit<BlogPost, "body">;
type DashboardMeditation = Omit<MeditationRelaxationItem, "instructions">;

const visibleCategoryIds = [
  "reha",
  "healthy-living",
  "overweight",
  "definition",
  "pre-post-birth",
  "corporate-fitness",
];
const categoryAliases: Record<string, string> = {
  intensive: "definition",
  "weight-loss": "overweight",
  "weight-reduction": "overweight",
};

const categoryOverviewSlugs: Record<string, string> = {
  definition: "intensive",
};

function canonicalCategory(value: unknown) {
  if (typeof value !== "string") return "";
  return categoryAliases[value] ?? value;
}

function getCourseCategoryOverviewSlug(categoryId: string) {
  return categoryOverviewSlugs[categoryId] ?? categoryId;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export default function Dashboard({ user }: { user: DashboardUser }) {
  const t = useTranslations("home.dashboard");
  const coursesT = useTranslations("courses");
  const relaxationT = useTranslations("relaxation");
  const packageT = useTranslations("packages");
  const packageSelectorT = useTranslations("profile.packageSelector");
  const locale = useLocale();
  const { profile, user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("for-you");
  const tabsRef = useRef<HTMLElement>(null);
  const [tabEdges, setTabEdges] = useState({ left: false, right: false });
  const [workouts, setWorkouts] = useState<DashboardWorkout[]>([]);
  const [recentPosts, setRecentPosts] = useState<DashboardPost[]>([]);
  const [meditationItems, setMeditationItems] = useState<DashboardMeditation[]>(
    [],
  );
  const [recentMeditations, setRecentMeditations] = useState<
    DashboardMeditation[]
  >([]);
  const [liveCourseIds, setLiveCourseIds] = useState<string[]>([]);
  const [loadedLocale, setLoadedLocale] = useState<string | null>(null);
  const isDashboardLoading = loadedLocale !== locale;

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/content/dashboard?locale=${locale}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Dashboard request failed with status ${response.status}`,
          );
        }

        return response.json();
      })
      .then(
        (payload: {
          liveCourseIds?: string[];
          workouts?: DashboardWorkout[];
          recentPosts?: DashboardPost[];
          meditationItems?: DashboardMeditation[];
          recentMeditations?: DashboardMeditation[];
        }) => {
          if (cancelled) return;
          setLiveCourseIds(payload.liveCourseIds ?? []);
          setWorkouts(payload.workouts ?? []);
          setRecentPosts(payload.recentPosts ?? []);
          setMeditationItems(payload.meditationItems ?? []);
          setRecentMeditations(payload.recentMeditations ?? []);
        },
      )
      .catch(() => {
        if (cancelled) return;
        setLiveCourseIds([]);
        setWorkouts([]);
        setRecentPosts([]);
        setMeditationItems([]);
        setRecentMeditations([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedLocale(locale);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const liveCourseIdSet = useMemo(
    () => new Set(liveCourseIds),
    [liveCourseIds],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const categories = useMemo(
    () =>
      memberCourseCategories
        .filter((category) => visibleCategoryIds.includes(category.id))
        .map((category) => ({
          id: category.id,
          title: coursesT(`courseTypes.categories.${category.id}.title`),
          description: coursesT(
            `courseTypes.categories.${category.id}.description`,
          ),
        })),
    [coursesT],
  );

  const {
    completedCourseCount,
    upcomingCourseCount,
    recommendedCourseIds: recommendedCourseIdSet,
  } = useMemo(() => getDashboardProgress(profile), [profile]);
  const activePackageLabel = profile
    ? packageT(profile.memberPackage)
    : packageSelectorT("inactive");
  const profileName =
    profile?.displayName || authUser?.displayName || user.name;
  const profileInitial = profileName.charAt(0).toUpperCase();
  const profilePhoto = authUser?.photoURL || profile?.photoURL || null;
  const showPlusPackageIcon = profile?.memberPackage === "plus";

  const tabs = [
    {
      id: "for-you",
      label: t("workouts.forYou"),
      description: t("workouts.forYouDescription"),
      href: `/${locale}/courses`,
    },
    ...categories.map((category) => ({
      id: category.id,
      label: category.title,
      description: category.description,
      href: `/${locale}/courses/${getCourseCategoryOverviewSlug(category.id)}`,
    })),
    {
      id: "meditation-relaxation",
      label: relaxationT("title"),
      description: t("meditation.description"),
      href: `/${locale}/meditation-relaxation`,
    },
  ];

  const activeGroup = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const activeCourses = useMemo(() => {
    if (activeTab === "meditation-relaxation") return [];

    if (activeTab === "for-you") {
      const recommended = workouts.filter((course) =>
        [course.id, course.slug, course.subcategoryKey].some((key) =>
          recommendedCourseIdSet.has(key),
        ),
      );

      return recommended.length ? recommended : workouts;
    }

    return workouts.filter(
      (course) => canonicalCategory(course.categoryKey) === activeTab,
    );
  }, [activeTab, recommendedCourseIdSet, workouts]);
  const activeMeditations =
    activeTab === "meditation-relaxation" ? meditationItems : [];
  const activeDashboardItems =
    activeTab === "meditation-relaxation" ? activeMeditations : activeCourses;
  const recentWorkouts = workouts.slice(0, 8);
  const getMeditationHref = (item: DashboardMeditation) =>
    `/${locale}/meditation-relaxation/${item.subcategoryKey || "guided-meditation"}/${item.slug}`;

  const scrollTabs = (direction: "left" | "right") => {
    const tabsElement = tabsRef.current;

    if (!tabsElement) {
      return;
    }

    tabsElement.scrollBy({
      left:
        direction === "left"
          ? -tabsElement.clientWidth * 0.72
          : tabsElement.clientWidth * 0.72,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const tabsElement = tabsRef.current;

    if (!tabsElement) {
      return;
    }

    const updateEdges = () => {
      const maxScroll = tabsElement.scrollWidth - tabsElement.clientWidth;

      setTabEdges({
        left: tabsElement.scrollLeft > 4,
        right: tabsElement.scrollLeft < maxScroll - 4,
      });
    };

    updateEdges();
    tabsElement.addEventListener("scroll", updateEdges, { passive: true });

    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(tabsElement);

    return () => {
      tabsElement.removeEventListener("scroll", updateEdges);
      resizeObserver.disconnect();
    };
  }, [tabs.length]);

  return (
    <section className={styles.dashboardSection}>
      <motion.div
        className={styles.shell}
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.aside className={styles.leftRail} variants={stagger}>
          <motion.header className={styles.appHeader} variants={fadeUp}>
            <div className={styles.profileCover} aria-hidden="true" />
            <div className={styles.profileIdentity}>
              <Link
                href={`/${locale}/profile`}
                className={styles.profilePhotoLink}
                aria-label={t("profile.open")}
              >
                {authUser ? (
                  <ProfileAvatar
                    userId={authUser.uid}
                    photoUrl={profilePhoto}
                    initial={profileInitial}
                    ariaLabel={t("profile.avatarAlt", { name: profileName })}
                    className={styles.profilePhoto}
                  />
                ) : (
                  <span className={styles.profilePhoto}>{profileInitial}</span>
                )}
              </Link>
              <div className={styles.profileText}>
                <h1 className={styles.title}>{profileName}</h1>
                <p className={styles.profileRole}>{t("profile.role")}</p>
              </div>
            </div>
            <div
              className={styles.profilePackage}
              data-testid="dashboard-overview-package"
            >
              <span>{t("profile.packageLabel")}</span>
              <strong>
                {showPlusPackageIcon ? <PlusCircle size={15} /> : null}
                {activePackageLabel}
              </strong>
            </div>
            <div className={styles.statusStrip}>
              <div
                className={styles.statusItem}
                data-testid="dashboard-overview-upcoming"
              >
                <span>{t("workouts.status.upcoming")}</span>
                <strong>{upcomingCourseCount}</strong>
              </div>
              <div
                className={styles.statusItem}
                data-testid="dashboard-overview-completed"
              >
                <span>{t("workouts.status.completed")}</span>
                <strong>{completedCourseCount}</strong>
              </div>
            </div>
          </motion.header>
          <motion.section
            className={styles.quizChallengePanel}
            variants={fadeUp}
          >
            <div className={styles.quizChallengeIcon} aria-hidden="true">
              <Brain size={26} />
            </div>
            <div className={styles.quizChallengeCopy}>
              <p className={styles.panelEyebrow}>{t("quiz.eyebrow")}</p>
              <h2>{t("quiz.title")}</h2>
              <div
                className={styles.quizChallengeMeta}
                aria-label={t("quiz.metaLabel")}
              >
                <span>
                  <Timer size={14} />
                  {t("quiz.timeboxed")}
                </span>
                <span>
                  <Crown size={14} />
                  {t("quiz.champions")}
                </span>
              </div>
            </div>
            <Link href={`/${locale}/quiz`} className={styles.quizChallengeLink}>
              {t("quiz.cta")}
              <ArrowUpRight size={15} />
            </Link>
          </motion.section>
        </motion.aside>

        <div className={styles.contentColumn}>
          <motion.div
            className={`${styles.tabsShell} ${tabEdges.left ? styles.tabsShellHasLeft : ""} ${
              tabEdges.right ? styles.tabsShellHasRight : ""
            }`}
            variants={fadeUp}
          >
            {tabEdges.left ? (
              <button
                type="button"
                className={`${styles.tabScrollButton} ${styles.tabScrollButtonLeft}`}
                onClick={() => scrollTabs("left")}
                aria-label="Show previous workout categories"
                data-testid="dashboard-workout-tabs-scroll-left"
              >
                <ChevronLeft size={16} />
              </button>
            ) : null}
            <nav
              ref={tabsRef}
              className={styles.tabs}
              aria-label="Workout categories"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabButton} ${tab.id === activeTab ? styles.tabButtonActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`dashboard-workout-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            {tabEdges.right ? (
              <button
                type="button"
                className={`${styles.tabScrollButton} ${styles.tabScrollButtonRight}`}
                onClick={() => scrollTabs("right")}
                aria-label="Show more workout categories"
                data-testid="dashboard-workout-tabs-scroll-right"
              >
                <ChevronRight size={16} />
              </button>
            ) : null}
          </motion.div>

          <motion.section
            key={`intro-${activeTab}`}
            className={styles.categoryIntro}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            data-testid="dashboard-active-workout-category"
          >
            <div>
              <Link href={activeGroup.href} className={styles.panelEyebrowLink}>
                {activeGroup.label}
                <ArrowUpRight size={13} />
              </Link>
              <h2>{activeGroup.description}</h2>
            </div>
            <span className={styles.sessionCount}>
              {t("workouts.sessions", { count: activeDashboardItems.length })}
            </span>
          </motion.section>

          <motion.div
            key={`features-${activeTab}`}
            className={styles.featureGrid}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {!isDashboardLoading
              ? activeDashboardItems.slice(0, 2).map((course, index) => (
                  <motion.article
                    key={course.id}
                    className={`${styles.featureCard} ${index === 0 ? styles.featureCardLarge : ""}`}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    data-testid={`dashboard-workout-card-${course.id}`}
                  >
                    {course.posterImage ? (
                      <Image
                        src={course.posterImage}
                        alt=""
                        fill
                        loading="eager"
                        sizes="(min-width: 1180px) 34vw, (min-width: 860px) 50vw, 100vw"
                        className={styles.featureImage}
                      />
                    ) : (
                      <div className={styles.featureFallback}>
                        <Play size={28} />
                      </div>
                    )}
                    <div className={styles.cardShade} />
                    {activeTab !== "meditation-relaxation" &&
                    liveCourseIdSet.has(course.id) ? (
                      <span className={styles.liveBadge}>
                        {t("workouts.live")}
                      </span>
                    ) : null}
                    <div className={styles.playBadge}>
                      <Play size={15} fill="currentColor" />
                    </div>
                    <div className={styles.cardCopy}>
                      <span className={styles.cardKicker}>
                        {activeTab === "meditation-relaxation"
                          ? t("meditation.kicker")
                          : index === 0
                            ? t("workouts.recommended")
                            : t("workouts.newWorkouts")}
                      </span>
                      <h2>{course.title}</h2>
                      <p>
                        {course.durationMinutes
                          ? `${course.durationMinutes} Min`
                          : packageT(course.packageRequired)}
                        {"coach" in course && course.coach
                          ? ` · ${course.coach}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={
                        activeTab === "meditation-relaxation"
                          ? getMeditationHref(course as DashboardMeditation)
                          : `/${locale}/courses/${course.slug}`
                      }
                      className={styles.featureLink}
                      aria-label={`${t("workouts.openSession")}: ${course.title}`}
                    />
                  </motion.article>
                ))
              : null}
            {isDashboardLoading ? (
              <>
                <div
                  className={`${styles.featureCard} ${styles.featureCardLarge} ${styles.featureSkeleton}`}
                  aria-hidden="true"
                  data-testid="dashboard-feature-loading"
                >
                  <span className={styles.skeletonPlay} />
                  <span className={styles.skeletonCopy} />
                </div>
                <div
                  className={`${styles.featureCard} ${styles.featureSkeleton} ${styles.featureSkeletonSecondary}`}
                  aria-hidden="true"
                >
                  <span className={styles.skeletonPlay} />
                  <span className={styles.skeletonCopy} />
                </div>
              </>
            ) : !activeDashboardItems.length ? (
              <div className={styles.filterEmptyState}>
                <Play size={22} />
                <p>
                  {activeTab === "meditation-relaxation"
                    ? t("meditation.empty")
                    : t("workouts.emptyCategory")}
                </p>
              </div>
            ) : null}
          </motion.div>

          {recentWorkouts.length ? (
            <motion.section
              className={styles.newsPanel}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <div
                className={`${styles.listHeader} ${styles.workoutListHeader}`}
              >
                <span>{t("workouts.newWorkouts")}</span>
                <Link
                  href={`/${locale}/courses`}
                  className={styles.viewAllLink}
                >
                  {t("news.viewAll")}
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className={styles.newsGrid}>
                {recentWorkouts.map((course) => (
                  <motion.article
                    key={course.id}
                    className={`${styles.newsCard} ${styles.workoutNewsCard}`}
                    variants={fadeUp}
                    whileHover={{ y: -3 }}
                    data-testid={`dashboard-workout-list-item-${course.id}`}
                  >
                    <Link
                      href={`/${locale}/courses/${course.slug}`}
                      className={styles.newsImage}
                      aria-label={course.title}
                    >
                      {course.posterImage ? (
                        <Image
                          src={course.posterImage}
                          alt=""
                          fill
                          loading="eager"
                          sizes="(min-width: 1180px) 18rem, (min-width: 720px) 33vw, 88vw"
                        />
                      ) : (
                        <Play size={24} />
                      )}
                      <span className={styles.thumbPlay}>
                        <Play size={13} fill="currentColor" />
                      </span>
                      {liveCourseIdSet.has(course.id) ? (
                        <span className={styles.liveBadge}>
                          {t("workouts.live")}
                        </span>
                      ) : null}
                    </Link>
                    <div className={styles.newsBody}>
                      <p className={styles.newsMeta}>
                        {course.publishedAt
                          ? dateFormatter.format(new Date(course.publishedAt))
                          : packageT(course.packageRequired)}
                        {course.durationMinutes ? (
                          <span>{course.durationMinutes} Min</span>
                        ) : course.publishedAt ? (
                          <span>{packageT(course.packageRequired)}</span>
                        ) : null}
                      </p>
                      <h3>
                        <Link href={`/${locale}/courses/${course.slug}`}>
                          {course.title}
                        </Link>
                      </h3>
                      {course.description || course.coach ? (
                        <p className={styles.newsExcerpt}>
                          {course.description}
                          {course.description && course.coach ? " · " : ""}
                          {course.coach
                            ? coursesT("courseTypes.meta.coach", {
                                name: course.coach,
                              })
                            : null}
                        </p>
                      ) : null}
                      <Link
                        href={`/${locale}/courses/${course.slug}`}
                        className={styles.newsReadLink}
                      >
                        {t("workouts.openSession")}
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          ) : null}

          {recentPosts.length ? (
            <motion.section
              className={styles.newsPanel}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <div className={`${styles.listHeader} ${styles.newsListHeader}`}>
                <span>{t("news.title")}</span>
                <Link href={`/${locale}/blogs`} className={styles.viewAllLink}>
                  {t("news.viewAll")}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className={styles.newsGrid}>
                {recentPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    className={styles.newsCard}
                    variants={fadeUp}
                    whileHover={{ y: -3 }}
                  >
                    <Link
                      href={`/${locale}/blogs/${post.slug}`}
                      className={styles.newsImage}
                      aria-label={post.title}
                    >
                      {post.featuredImage ? (
                        <Image
                          src={post.featuredImage}
                          alt=""
                          fill
                          loading={index === 0 ? "eager" : "lazy"}
                          sizes="(min-width: 1180px) 18rem, (min-width: 720px) 33vw, 88vw"
                        />
                      ) : (
                        <BookOpen size={24} />
                      )}
                    </Link>
                    <div className={styles.newsBody}>
                      <p className={styles.newsMeta}>
                        {dateFormatter.format(new Date(post.publishedAt))}
                        <span>
                          {t("news.readTime", { count: post.readTimeMinutes })}
                        </span>
                      </p>
                      <h3>
                        <Link href={`/${locale}/blogs/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>
                      {post.excerpt ? (
                        <p className={styles.newsExcerpt}>{post.excerpt}</p>
                      ) : null}
                      <Link
                        href={`/${locale}/blogs/${post.slug}`}
                        className={styles.newsReadLink}
                      >
                        {t("news.read")}
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          ) : null}

          {recentMeditations.length ? (
            <motion.section
              className={styles.newsPanel}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <div className={`${styles.listHeader} ${styles.newsListHeader}`}>
                <span>{t("meditation.latestTitle")}</span>
                <Link
                  href={`/${locale}/meditation-relaxation`}
                  className={styles.viewAllLink}
                >
                  {t("news.viewAll")}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className={styles.newsGrid}>
                {recentMeditations.map((item, index) => (
                  <motion.article
                    key={item.id}
                    className={styles.newsCard}
                    variants={fadeUp}
                    whileHover={{ y: -3 }}
                  >
                    <Link
                      href={getMeditationHref(item)}
                      className={`${styles.newsImage} ${styles.meditationImage}`}
                      aria-label={item.title}
                    >
                      {item.posterImage ? (
                        <Image
                          src={item.posterImage}
                          alt=""
                          fill
                          loading={index === 0 ? "eager" : "lazy"}
                          sizes="(min-width: 1180px) 18rem, (min-width: 720px) 33vw, 88vw"
                        />
                      ) : (
                        <Sparkles size={24} />
                      )}
                    </Link>
                    <div className={styles.newsBody}>
                      <p className={styles.newsMeta}>
                        {item.publishedAt
                          ? dateFormatter.format(new Date(item.publishedAt))
                          : relaxationT("title")}
                        {item.durationMinutes ? (
                          <span>
                            {t("meditation.duration", {
                              count: item.durationMinutes,
                            })}
                          </span>
                        ) : null}
                      </p>
                      <h3>
                        <Link href={getMeditationHref(item)}>{item.title}</Link>
                      </h3>
                      {item.description ? (
                        <p className={styles.newsExcerpt}>{item.description}</p>
                      ) : null}
                      <Link
                        href={getMeditationHref(item)}
                        className={styles.newsReadLink}
                      >
                        {t("meditation.open")}
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
