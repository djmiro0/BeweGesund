"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memberDashboard } from "@/data";
import styles from "./Dashboard.module.css";

interface DashboardUser {
    name: string;
}

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

const statRise = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

export default function Dashboard({ user }: { user: DashboardUser }) {
    const t = useTranslations("home.dashboard");
    const courseT = useTranslations("courseCatalog");
    const packageT = useTranslations("packages");
    const locale = useLocale();
    const overviewStats = [
        {
            key: "package",
            label: t("summary.currentPackage"),
            value: packageT(memberDashboard.package),
            hint: t("summary.packageDescription"),
            icon: Sparkles,
            progress: "74%",
            featured: true,
        },
        {
            key: "upcoming",
            label: t("summary.upcoming"),
            value: memberDashboard.upcomingCourseIds.length,
            hint: t("summary.upcomingDescription"),
            icon: CalendarDays,
            progress: `${Math.min(memberDashboard.upcomingCourseIds.length * 24, 100)}%`,
        },
        {
            key: "completed",
            label: t("summary.completed"),
            value: memberDashboard.completedCourseIds.length,
            hint: t("summary.completedDescription"),
            icon: CheckCircle2,
            progress: `${Math.min(memberDashboard.completedCourseIds.length * 28, 100)}%`,
        },
    ];

    return (
        <section className={styles.dashboardSection}>
            <motion.div
                className={styles.shell}
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.08,
                        },
                    },
                }}
            >
                <div className={styles.hero}>
                    <motion.div className={styles.heroMain} variants={fadeUp}>
                        <p className={styles.eyebrow}>{t("eyebrow")}</p>
                        <div className={styles.overviewHeader}>
                            <div>
                                <h1 className={styles.title}>{t("greeting", { name: user.name.split(" ")[0] })}</h1>
                                <p className={styles.description}>{t("ready")}</p>
                            </div>
                            <div className={styles.overviewPulse} aria-hidden="true" />
                        </div>
                        <motion.div
                            className={styles.overviewStats}
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
                            }}
                        >
                            {overviewStats.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <motion.div
                                        key={item.key}
                                        className={`${styles.metricCard} ${item.featured ? styles.metricCardAccent : ""}`}
                                        variants={statRise}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        style={{ "--metric-progress": item.progress } as CSSProperties}
                                        data-testid={`dashboard-overview-${item.key}`}
                                    >
                                        <div className={styles.metricTopline}>
                                            <span className={styles.metricIcon}>
                                                <Icon size={15} />
                                            </span>
                                            <p className={styles.metricLabel}>{item.label}</p>
                                        </div>
                                        <p className={styles.metricValue}>{item.value}</p>
                                        <div className={styles.metricTrack} aria-hidden="true">
                                            <span />
                                        </div>
                                        <p className={styles.metricHint}>{item.hint}</p>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                        <div className={styles.actions}>
                            <Link href={`/${locale}/calendar`} className={styles.primaryButton}>
                                {t("actions.openCalendar")}
                                <CalendarDays size={16} />
                            </Link>
                            <Link href={`/${locale}/consultation`} className={styles.secondaryButton}>
                                {t("actions.bookConsultation")}
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                <div className={styles.contentGrid}>
                    <motion.section className={styles.panel} variants={fadeUp}>
                        <div className={styles.panelHeader}>
                            <div>
                                <p className={styles.panelEyebrow}>{t("sections.upcoming.eyebrow")}</p>
                                <h2 className={styles.panelTitle}>{t("sections.upcoming.title")}</h2>
                            </div>
                            <ShieldCheck className={styles.panelIcon} size={22} />
                        </div>
                        <div className={styles.courseList}>
                            {memberDashboard.upcomingCourseIds.map((courseId, index) => (
                                <motion.div key={courseId} className={styles.courseCard} whileHover={{ y: -4 }}>
                                    <div className={styles.courseMain}>
                                        <div className={styles.courseIndex}>{String(index + 1).padStart(2, "0")}</div>
                                        <div>
                                            <p className={styles.courseName}>{courseT(courseId)}</p>
                                            <p className={styles.courseHint}>{t("sections.upcoming.description")}</p>
                                        </div>
                                    </div>
                                    <Link href={`/${locale}/calendar`} className={styles.sectionLink}>
                                        {t("actions.joinFromCalendar")}
                                        <ArrowRight size={15} />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    <div className={styles.stack}>
                        <motion.section className={styles.panel} variants={fadeUp}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <p className={styles.panelEyebrow}>{t("sections.completed.eyebrow")}</p>
                                    <h2 className={styles.panelTitle}>{t("sections.completed.title")}</h2>
                                </div>
                                <CheckCircle2 className={styles.panelIcon} size={22} />
                            </div>
                            <div className={styles.completedList}>
                                {memberDashboard.completedCourseIds.map((courseId) => (
                                    <div key={courseId} className={styles.completedCard}>
                                        <span className={styles.courseName}>{courseT(courseId)}</span>
                                        <span className={styles.completedBadge}>{t("sections.completed.done")}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        <motion.section className={styles.accentPanel} variants={fadeUp}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <p className={styles.panelEyebrow}>{t("sections.explore.eyebrow")}</p>
                                    <h2 className={styles.panelTitle}>{t("sections.explore.title")}</h2>
                                </div>
                                <Compass className={styles.panelIcon} size={22} />
                            </div>
                            <p className={styles.accentCopy}>{t("sections.explore.description")}</p>
                            <div className={styles.exploreList}>
                                {memberDashboard.recommendedCourseIds.map((courseId) => (
                                    <motion.div key={courseId} className={styles.exploreCard} whileHover={{ y: -4 }}>
                                        <span className={styles.courseName}>{courseT(courseId)}</span>
                                        <Link href={`/${locale}/courses`} className={styles.sectionLink}>
                                            {t("actions.explorePrograms")}
                                            <ArrowRight size={15} />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
