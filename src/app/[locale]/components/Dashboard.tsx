"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Play, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memberCourseCategories, memberCourses, memberDashboard } from "@/data";
import styles from "./Dashboard.module.css";

interface DashboardUser {
    name: string;
}

const visibleCategoryIds = ["reha", "healthy-living", "overweight", "definition", "pre-post-birth", "corporate-fitness"];
const thumbnailPool = ["/training.jpg", "/weights.jpg", "/food.jpg"];
const getThumbnail = (index: number) => thumbnailPool[index % thumbnailPool.length];

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
    const courseT = useTranslations("courseCatalog");
    const packageT = useTranslations("packages");
    const locale = useLocale();
    const [activeTab, setActiveTab] = useState("for-you");
    const tabsRef = useRef<HTMLElement>(null);
    const videosRef = useRef<HTMLDivElement>(null);
    const [tabEdges, setTabEdges] = useState({ left: false, right: false });
    const [videoEdges, setVideoEdges] = useState({ left: false, right: false });

    const categories = useMemo(
        () =>
            memberCourseCategories
                .filter((category) => visibleCategoryIds.includes(category.id))
                .map((category) => ({
                    id: category.id,
                    title: coursesT(`courseTypes.categories.${category.id}.title`),
                    description: coursesT(`courseTypes.categories.${category.id}.description`),
                    courseIds: category.courseIds,
                })),
        [coursesT],
    );

    const recommendedCourseIds = useMemo(
        () => Array.from(new Set([...memberDashboard.recommendedCourseIds, ...memberDashboard.upcomingCourseIds])),
        [],
    );

    const tabs = [
        {
            id: "for-you",
            label: t("workouts.forYou"),
            description: t("workouts.forYouDescription"),
            courseIds: recommendedCourseIds,
        },
        ...categories.map((category) => ({
            id: category.id,
            label: category.title,
            description: category.description,
            courseIds: category.courseIds,
        })),
    ];

    const activeGroup = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
    const activeCourses = activeGroup.courseIds
        .map((courseId) => memberCourses.find((course) => course.id === courseId))
        .filter((course): course is (typeof memberCourses)[number] => course !== undefined);

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
    }, [activeTab, activeCourses.length]);

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
                            <strong>{packageT(memberDashboard.package)}</strong>
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
                                <Image
                                    src={getThumbnail(index)}
                                    alt=""
                                    fill
                                    loading="eager"
                                    sizes="(min-width: 1180px) 34vw, (min-width: 860px) 50vw, 100vw"
                                    className={styles.featureImage}
                                />
                                <div className={styles.cardShade} />
                                <div className={styles.playBadge}>
                                    <Play size={15} fill="currentColor" />
                                </div>
                                <div className={styles.cardCopy}>
                                    <span className={styles.cardKicker}>{index === 0 ? t("workouts.recommended") : t("workouts.newWorkouts")}</span>
                                    <h2>{courseT(course.id)}</h2>
                                    <p>
                                        {course.durationMinutes ? `${course.durationMinutes} Min` : packageT(course.packageRequired)}
                                        {course.coach ? ` · ${course.coach}` : ""}
                                    </p>
                                </div>
                            </motion.article>
                        ))}
                    </motion.div>

                    <motion.section
                        key={`workouts-${activeTab}`}
                        className={styles.workoutPanel}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                    >
                        <div className={styles.listHeader}>
                            <span>{t("workouts.newWorkouts")}</span>
                            <small>{t("workouts.lockedSoon")}</small>
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
                                {activeCourses.map((course, index) => (
                                    <motion.article
                                        key={course.id}
                                        className={styles.workoutCard}
                                        variants={fadeUp}
                                        whileHover={{ y: -3 }}
                                        data-testid={`dashboard-workout-list-item-${course.id}`}
                                    >
                                        <div className={styles.workoutThumb}>
                                            <Image
                                                src={getThumbnail(index + 1)}
                                                alt=""
                                                fill
                                                loading="eager"
                                                sizes="7rem"
                                                className={styles.workoutImage}
                                            />
                                            <span className={styles.thumbPlay}>
                                                <Play size={13} fill="currentColor" />
                                            </span>
                                        </div>
                                        <div className={styles.workoutBody}>
                                            <h3>{courseT(course.id)}</h3>
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
                                                {course.unlocksPerWeek ? (
                                                    <span>
                                                        <CalendarDays size={13} />
                                                        {coursesT("courseTypes.meta.unlocks", { count: course.unlocksPerWeek })}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {course.noteKey || course.coach ? (
                                                <p className={styles.workoutNote}>
                                                    {course.noteKey ? coursesT(`courseTypes.notes.${course.noteKey}`) : null}
                                                    {course.noteKey && course.coach ? " · " : ""}
                                                    {course.coach ? coursesT("courseTypes.meta.coach", { name: course.coach }) : null}
                                                </p>
                                            ) : null}
                                        </div>
                                        <Link href={`/${locale}/courses/${course.id}`} className={styles.openButton}>
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
                </div>
            </motion.div>
        </section>
    );
}
