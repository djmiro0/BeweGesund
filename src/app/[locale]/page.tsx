"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "./components/AuthProvider";
import Dashboard from "./components/Dashboard";
import HeroSection from "./components/HeroSection";
import VideoSection from "./components/VideoSection";
import BannerSection from "../components/BannerSection/BannerSection";
import styles from "./page.module.css";
import { getProfileFirstName } from "@/lib/userProfile";

const highlightIcons = [ShieldCheck, CalendarDays, Sparkles];

export default function HomePage() {
    const t = useTranslations("home");
    const locale = useLocale();
    const { user, profile, loading, openAuth } = useAuth();
    const highlights = t.raw("public.highlights") as string[];
    const displayName = profile
        ? getProfileFirstName(profile, user?.displayName) || "Member"
        : user?.displayName?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "Member";

    if (loading) return <div className={styles.loadingScreen}>{t("loading")}</div>;

    return (
        <div className={styles.homePage}>
            {user ? (
                <Dashboard user={{ name: displayName }} />
            ) : (
                <>
                    <HeroSection openAuth={openAuth} />
                    <section className={styles.publicSection}>
                        <div className={styles.publicInner}>
                            <motion.div
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.35 }}
                                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <p className={styles.eyebrow}>{t("public.eyebrow")}</p>
                                <h2 className={styles.publicTitle}>{t("public.title")}</h2>
                                <p className={styles.publicDescription}>{t("public.description")}</p>
                                <div className={styles.publicActions}>
                                    <Link href={`/${locale}/courses`} className={styles.primaryLink}>
                                        {t("public.primaryCta")}
                                        <ArrowRight size={16} />
                                    </Link>
                                    <button onClick={openAuth} className={styles.secondaryLink}>
                                        {t("public.secondaryCta")}
                                        <Sparkles size={16} />
                                    </button>
                                </div>
                            </motion.div>
                            <motion.div
                                className={styles.highlightGrid}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.25 }}
                                variants={{
                                    hidden: {},
                                    visible: { transition: { staggerChildren: 0.09 } },
                                }}
                            >
                                {highlights.map((item, index) => {
                                    const Icon = highlightIcons[index] ?? Sparkles;

                                    return (
                                        <motion.div
                                            key={item}
                                            className={styles.highlightItem}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: { opacity: 1, y: 0 },
                                            }}
                                            whileHover={{ y: -6 }}
                                        >
                                            <span className={styles.highlightIcon}>
                                                <Icon size={20} />
                                            </span>
                                            <p>{item}</p>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>
                    </section>
                    <BannerSection />
                    <VideoSection />
                </>
            )}
        </div>
    );
}
