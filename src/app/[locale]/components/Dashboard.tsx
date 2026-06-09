"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Clock3, Play, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memberCourseCategories, memberDashboard } from "@/data";
import type { BlogPost, CourseSummary } from "@/lib/contentful";
import { useAuth } from "./AuthProvider";
import styles from "./Dashboard.module.css";

interface DashboardUser {
    name: string;
}

type DashboardWorkout = Omit<CourseSummary, "liveTrainingLink">;
type DashboardPost = Omit<BlogPost, "body">;

const visibleCategoryIds = ["reha", "healthy-living", "overweight", "definition", "pre-post-birth", "corporate-fitness"];
const categoryAliases: Record<string, string> = {
    intensive: "definition",
    "weight-loss": "overweight",
    "weight-reduction": "overweight",
};

function canonicalCategory(value: unknown) {
    if (typeof value !== "string") return "";
    return categoryAliases[value] ?? value;
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
    const packageT = useTranslations("packages");
    const locale = useLocale();
    const { memberPackage } = useAuth();
    const [activeTab, setActiveTab] = useState("for-you");
    const tabsRef = useRef<HTMLElement>(null);
    const videosRef = useRef<HTMLDivElement>(null);
    const [tabEdges, setTabEdges] = useState({ left: false, right: false });
    const [videoEdges, setVideoEdges] = useState({ left: false, right: false });
    const [workouts, setWorkouts] = useState<DashboardWorkout[]>([]);
    const [recentPosts, setRecentPosts] = useState<DashboardPost[]>([]);
    const [liveCourseIds, setLiveCourseIds] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;

        void fetch(`/api/content/dashboard?locale=${locale}`)
            .then((response) => response.json())
            .then((payload: {
                liveCourseIds?: string[];
                workouts?: DashboardWorkout[];
                recentPosts?: DashboardPost[];
            }) => {
                if (cancelled) return;
                setLiveCourseIds(payload.liveCourseIds ?? []);
                setWorkouts(payload.workouts ?? []);
                setRecentPosts(payload.recentPosts ?? []);
            })
            .catch(() => {
                if (cancelled) return;
                setLiveCourseIds([]);
                setWorkouts([]);
                setRecentPosts([]);
            });

        return () => {
            cancelled = true;
        };
    }, [locale]);

    const liveCourseIdSet = useMemo(() => new Set(liveCourseIds), [liveCourseIds]);

    const dateFormatter = useMemo(
        () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
        [locale],
    );

    const categories = useMemo(
        () =>
            memberCourseCategories
                .filter((category) => visibleCategoryIds.includes(category.id))
                .map((category) => ({
                    id: category.id,
                    title: coursesT(`courseTypes.categories.${category.id}.title`),
                    description: coursesT(`courseTypes.categories.${category.id}.description`),
                })),
        [coursesT],
    );

    const recommendedCourseIds = useMemo(
        () => Array.from(new Set([...memberDashboard.recommendedCourseIds, ...memberDashboard.upcomingCourseIds])),
        [],
    );
    const recommendedCourseIdSet = useMemo(() => new Set(recommendedCourseIds), [recommendedCourseIds]);

    const tabs = [
        {
            id: "for-you",
            label: t("workouts.forYou"),
            description: t("workouts.forYouDescription"),
        },
        ...categories.map((category) => ({
            id: category.id,
            label: category.title,
            description: category.description,
        })),
    ];

    const activeGroup = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
    const activeCourses = useMemo(() => {
        if (activeTab === "for-you") {
            const recommended = workouts.filter((course) =>
                [course.id, course.slug, course.subcategoryKey]
                    .some((key) => recommendedCourseIdSet.has(key)),
            );

            return recommended.length ? recommended : workouts;
        }

        return workouts.filter((course) => canonicalCategory(course.categoryKey) === activeTab);
    }, [activeTab, recommendedCourseIdSet, workouts]);
    const recentWorkouts = workouts.slice(0, 8);

    const scrollTabs = (direction: "left" | "right") => {
        const tabsElement = tabsRef.current;

        if (!tabsElement) {
            return;
        }

        tabsElement.scrollBy({
            left: direction === "left" ? -tabsElement.clientWidth * 0.72 : tabsElement.clientWidth * 0.72,
            behavior: "smooth",
        });
    };

    const scrollVideos = (direction: "left" | "right") => {
        const videosElement = videosRef.current;

        if (!videosElement) {
            return;
        }

        videosElement.scrollBy({
            left: direction === "left" ? -videosElement.clientWidth * 0.82 : videosElement.clientWidth * 0.82,
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

    useEffect(() => {
        const videosElement = videosRef.current;

        if (!videosElement) {
            return;
        }

        videosElement.scrollLeft = 0;

        const updateEdges = () => {
            const maxScroll = videosElement.scrollWidth - videosElement.clientWidth;

            setVideoEdges({
                left: videosElement.scrollLeft > 4,
                right: videosElement.scrollLeft < maxScroll - 4,
            });
        };

        updateEdges();
        videosElement.addEventListener("scroll", updateEdges, { passive: true });

        const resizeObserver = new ResizeObserver(updateEdges);
        resizeObserver.observe(videosElement);

        return () => {
            videosElement.removeEventListener("scroll", updateEdges);
            resizeObserver.disconnect();
        };
    }, [recentWorkouts.length]);

    return (
        <section className={styles.dashboardSection}>
            <motion.div className={styles.shell} initial="hidden" animate="visible" variants={stagger}>
                <motion.header className={styles.appHeader} variants={fadeUp}>
                    <div className={styles.profileRow}>
                        <div>
                            <p className={styles.welcome}>{t("greeting", { name: user.name.split(" ")[0] })}</p>
                            <h1 className={styles.title}>{t("workouts.title")}</h1>
                        </div>
                        <Link href={`/${locale}/profile`} className={styles.profileButton} aria-label="Profile">
                            {user.name.charAt(0).toUpperCase()}
                        </Link>
                    </div>
                    <p className={styles.subtitle}>{t("workouts.subtitle")}</p>
                    <div className={styles.statusStrip}>
                        <div className={styles.statusItem} data-testid="dashboard-overview-package">
                            <span>{t("workouts.status.package")}</span>
                            <strong>{packageT(memberPackage)}</strong>
                        </div>
                        <div className={styles.statusItem} data-testid="dashboard-overview-upcoming">
                            <span>{t("workouts.status.upcoming")}</span>
                            <strong>{memberDashboard.upcomingCourseIds.length}</strong>
                        </div>
                        <div className={styles.statusItem} data-testid="dashboard-overview-completed">
                            <span>{t("workouts.status.completed")}</span>
                            <strong>{memberDashboard.completedCourseIds.length}</strong>
                        </div>
                    </div>
                </motion.header>

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
                        <nav ref={tabsRef} className={styles.tabs} aria-label="Workout categories">
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
                            <p className={styles.panelEyebrow}>{activeGroup.label}</p>
                            <h2>{activeGroup.description}</h2>
                        </div>
                        <span className={styles.sessionCount}>{t("workouts.sessions", { count: activeCourses.length })}</span>
                    </motion.section>

                    <motion.div
                        key={`features-${activeTab}`}
                        className={styles.featureGrid}
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                    >
                        {activeCourses.slice(0, 2).map((course, index) => (
                            <motion.article
                                key={course.id}
                                className={`${styles.featureCard} ${index === 0 ? styles.featureCardLarge : ""}`}
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
                                {liveCourseIdSet.has(course.id) ? (
                                    <span className={styles.liveBadge}>{t("workouts.live")}</span>
                                ) : null}
                                <div className={styles.playBadge}>
                                    <Play size={15} fill="currentColor" />
                                </div>
                                <div className={styles.cardCopy}>
                                    <span className={styles.cardKicker}>{index === 0 ? t("workouts.recommended") : t("workouts.newWorkouts")}</span>
                                    <h2>{course.title}</h2>
                                    <p>
                                        {course.durationMinutes ? `${course.durationMinutes} Min` : packageT(course.packageRequired)}
                                        {course.coach ? ` · ${course.coach}` : ""}
                                    </p>
                                </div>
                                <Link
                                    href={`/${locale}/courses/${course.slug}`}
                                    className={styles.featureLink}
                                    aria-label={`${t("workouts.openSession")}: ${course.title}`}
                                />
                            </motion.article>
                        ))}
                        {!activeCourses.length ? (
                            <div className={styles.filterEmptyState}>
                                <Play size={22} />
                                <p>{t("workouts.emptyCategory")}</p>
                            </div>
                        ) : null}
                    </motion.div>

                    {recentWorkouts.length ? (
                        <motion.section
                            className={styles.workoutPanel}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                        >
                        <div className={styles.listHeader}>
                            <span>{t("workouts.newWorkouts")}</span>
                            <small>{t("workouts.recentDescription")}</small>
                        </div>

                        <div
                            className={`${styles.workoutCarousel} ${videoEdges.left ? styles.workoutCarouselHasLeft : ""} ${
                                videoEdges.right ? styles.workoutCarouselHasRight : ""
                            }`}
                        >
                            {videoEdges.left ? (
                                <button
                                    type="button"
                                    className={`${styles.tabScrollButton} ${styles.videoScrollButtonLeft}`}
                                    onClick={() => scrollVideos("left")}
                                    aria-label="Show previous workout videos"
                                    data-testid="dashboard-workout-videos-scroll-left"
                                >
                                    <ChevronLeft size={16} />
                            </button>
                        ) : null}
                            <div ref={videosRef} className={styles.workoutGrid}>
                                {recentWorkouts.map((course) => (
                                    <motion.article
                                        key={course.id}
                                        className={styles.workoutCard}
                                        variants={fadeUp}
                                        whileHover={{ y: -3 }}
                                        data-testid={`dashboard-workout-list-item-${course.id}`}
                                    >
                                        <div className={styles.workoutThumb}>
                                            {course.posterImage ? (
                                                <Image
                                                    src={course.posterImage}
                                                    alt=""
                                                    fill
                                                    loading="eager"
                                                    sizes="7rem"
                                                    className={styles.workoutImage}
                                                />
                                            ) : (
                                                <span className={styles.workoutThumbFallback}>
                                                    <Play size={20} />
                                                </span>
                                            )}
                                            <span className={styles.thumbPlay}>
                                                <Play size={13} fill="currentColor" />
                                            </span>
                                            {liveCourseIdSet.has(course.id) ? (
                                                <span className={styles.liveBadge}>{t("workouts.live")}</span>
                                            ) : null}
                                        </div>
                                        <div className={styles.workoutBody}>
                                            <h3>{course.title}</h3>
                                            <div className={styles.metaRow}>
                                                {course.durationMinutes ? (
                                                    <span>
                                                        <Clock3 size={13} />
                                                        {course.durationMinutes} Min
                                                    </span>
                                                ) : null}
                                                <span>
                                                    <Sparkles size={13} />
                                                    {packageT(course.packageRequired)}
                                                </span>
                                                {course.publishedAt ? (
                                                    <span>
                                                        {dateFormatter.format(new Date(course.publishedAt))}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {course.description || course.coach ? (
                                                <p className={styles.workoutNote}>
                                                    {course.description}
                                                    {course.description && course.coach ? " · " : ""}
                                                    {course.coach ? coursesT("courseTypes.meta.coach", { name: course.coach }) : null}
                                                </p>
                                            ) : null}
                                        </div>
                                        <Link href={`/${locale}/courses/${course.slug}`} className={styles.openButton}>
                                            {t("workouts.openSession")}
                                            <ArrowUpRight size={14} />
                                        </Link>
                                    </motion.article>
                                ))}
                            </div>
                            {videoEdges.right ? (
                                <button
                                    type="button"
                                    className={`${styles.tabScrollButton} ${styles.videoScrollButtonRight}`}
                                    onClick={() => scrollVideos("right")}
                                    aria-label="Show more workout videos"
                                    data-testid="dashboard-workout-videos-scroll-right"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            ) : null}
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
                            <div className={styles.listHeader}>
                                <span>{t("news.title")}</span>
                                <Link href={`/${locale}/blogs`} className={styles.viewAllLink}>
                                    {t("news.viewAll")}
                                    <ArrowUpRight size={14} />
                                </Link>
                            </div>
                            <div className={styles.newsGrid}>
                                {recentPosts.map((post) => (
                                    <motion.article
                                        key={post.id}
                                        className={styles.newsCard}
                                        variants={fadeUp}
                                        whileHover={{ y: -3 }}
                                    >
                                        <Link href={`/${locale}/blogs/${post.slug}`} className={styles.newsImage}>
                                            {post.featuredImage ? (
                                                <Image
                                                    src={post.featuredImage}
                                                    alt=""
                                                    fill
                                                    sizes="(min-width: 1180px) 18rem, (min-width: 720px) 33vw, 88vw"
                                                />
                                            ) : (
                                                <BookOpen size={24} />
                                            )}
                                        </Link>
                                        <div className={styles.newsBody}>
                                            <p className={styles.newsMeta}>
                                                {dateFormatter.format(new Date(post.publishedAt))}
                                                <span>{t("news.readTime", { count: post.readTimeMinutes })}</span>
                                            </p>
                                            <h3>
                                                <Link href={`/${locale}/blogs/${post.slug}`}>{post.title}</Link>
                                            </h3>
                                            {post.excerpt ? <p className={styles.newsExcerpt}>{post.excerpt}</p> : null}
                                            <Link href={`/${locale}/blogs/${post.slug}`} className={styles.newsReadLink}>
                                                {t("news.read")}
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
