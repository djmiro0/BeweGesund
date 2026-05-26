"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Compass, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memberDashboard } from "@/data";

interface DashboardUser {
    name: string;
}

export default function Dashboard({ user }: { user: DashboardUser }) {
    const t = useTranslations("home.dashboard");
    const courseT = useTranslations("courseCatalog");
    const packageT = useTranslations("packages");
    const locale = useLocale();

    return (
        <section className="border-b border-[var(--border-soft)] bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.16),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(var(--accent-soft-rgb),0.1),transparent_18%),linear-gradient(180deg,rgba(var(--navy-rgb),0.99)_0%,rgba(var(--navy-rgb),0.93)_100%)] px-6 pb-16 pt-32 text-[var(--text-light)]">
            <div className="mx-auto flex max-w-7xl flex-col gap-14">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[var(--highlight-soft)]">
                            {t("eyebrow")}
                        </p>
                        <h1 className="text-4xl font-black uppercase italic leading-[0.95] md:text-6xl">
                            {t("greeting", { name: user.name.split(" ")[0] })}
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
                            {t("ready")}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href={`/${locale}/calendar`}
                            className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--text-light)] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)]"
                        >
                            {t("actions.openCalendar")}
                            <CalendarDays size={16} />
                        </Link>
                        <Link
                            href={`/${locale}/consultation`}
                            className="inline-flex items-center justify-center gap-3 rounded-full border border-[var(--border-strong)] bg-[rgba(var(--foreground-rgb),0.04)] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[var(--text-light)] transition hover:bg-[rgba(var(--foreground-rgb),0.08)]"
                        >
                            {t("actions.bookConsultation")}
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.8rem] border border-[rgba(var(--accent-soft-rgb),0.22)] bg-[linear-gradient(180deg,rgba(var(--foreground-rgb),0.09),rgba(var(--foreground-rgb),0.04))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--text-dim)]">
                            {t("summary.currentPackage")}
                        </p>
                        <p className="mt-4 text-3xl font-black uppercase italic text-[var(--highlight-soft)]">
                            {packageT(memberDashboard.package)}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                            {t("summary.packageDescription")}
                        </p>
                    </div>
                    <div className="rounded-[1.8rem] border border-[rgba(var(--foreground-rgb),0.18)] bg-[linear-gradient(180deg,rgba(var(--foreground-rgb),0.08),rgba(var(--foreground-rgb),0.03))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--text-dim)]">
                            {t("summary.upcoming")}
                        </p>
                        <p className="mt-4 text-4xl font-black text-[var(--text-light)]">
                            {memberDashboard.upcomingCourseIds.length}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                            {t("summary.upcomingDescription")}
                        </p>
                    </div>
                    <div className="rounded-[1.8rem] border border-[rgba(var(--foreground-rgb),0.18)] bg-[linear-gradient(180deg,rgba(var(--foreground-rgb),0.08),rgba(var(--foreground-rgb),0.03))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--text-dim)]">
                            {t("summary.completed")}
                        </p>
                        <p className="mt-4 text-4xl font-black text-[var(--text-light)]">
                            {memberDashboard.completedCourseIds.length}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                            {t("summary.completedDescription")}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-[2rem] border border-[rgba(var(--foreground-rgb),0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-7 shadow-[0_36px_90px_rgba(0,0,0,0.24)] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--highlight-soft)]">
                                    {t("sections.upcoming.eyebrow")}
                                </p>
                                <h2 className="mt-2 text-2xl font-black uppercase italic">
                                    {t("sections.upcoming.title")}
                                </h2>
                            </div>
                            <ShieldCheck className="text-[var(--highlight)]" size={22} />
                        </div>
                        <div className="mt-6 flex flex-col gap-4">
                            {memberDashboard.upcomingCourseIds.map((courseId, index) => (
                                <div
                                    key={courseId}
                                    className="flex flex-col gap-4 rounded-[1.5rem] border border-[rgba(var(--accent-soft-rgb),0.16)] bg-[linear-gradient(180deg,rgba(var(--navy-rgb),0.78),rgba(var(--navy-rgb),0.58))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(var(--accent-soft-rgb),0.22)] bg-[rgba(var(--accent-soft-rgb),0.14)] text-sm font-black uppercase text-[var(--highlight-soft)]">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-[var(--text-light)]">
                                                {courseT(courseId)}
                                            </p>
                                            <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
                                                {t("sections.upcoming.description")}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/${locale}/calendar`}
                                        className="inline-flex items-center gap-2 self-start text-sm font-black uppercase tracking-[0.16em] text-[var(--highlight-soft)] transition hover:text-[var(--text-light)]"
                                    >
                                        {t("actions.joinFromCalendar")}
                                        <ArrowRight size={15} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-6">
                        <div className="rounded-[2rem] border border-[rgba(var(--foreground-rgb),0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-7 shadow-[0_34px_84px_rgba(0,0,0,0.22)] backdrop-blur-md">
                            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--highlight-soft)]">
                                        {t("sections.completed.eyebrow")}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black uppercase italic">
                                        {t("sections.completed.title")}
                                    </h2>
                                </div>
                                <CheckCircle2 className="text-[var(--highlight)]" size={22} />
                            </div>
                            <div className="mt-6 flex flex-col gap-3">
                                {memberDashboard.completedCourseIds.map((courseId) => (
                                    <div
                                        key={courseId}
                                        className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-[rgba(var(--foreground-rgb),0.12)] bg-[rgba(var(--navy-rgb),0.5)] px-4 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                                    >
                                        <span className="font-bold text-[var(--text-light)]">
                                            {courseT(courseId)}
                                        </span>
                                        <span className="rounded-full bg-[rgba(var(--accent-soft-rgb),0.16)] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--highlight-soft)]">
                                            {t("sections.completed.done")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-[rgba(var(--accent-rgb),0.34)] bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.28),rgba(var(--accent-soft-rgb),0.2))] p-7 text-[var(--text-light)] shadow-[0_34px_88px_rgba(0,0,0,0.24)]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--text-light)]">
                                        {t("sections.explore.eyebrow")}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black uppercase italic">
                                        {t("sections.explore.title")}
                                    </h2>
                                </div>
                                <Compass size={22} />
                            </div>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-[rgba(var(--foreground-rgb),0.88)]">
                                {t("sections.explore.description")}
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                {memberDashboard.recommendedCourseIds.map((courseId) => (
                                    <div
                                        key={courseId}
                                        className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-[rgba(var(--foreground-rgb),0.22)] bg-[rgba(var(--navy-rgb),0.24)] px-4 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                                    >
                                        <span className="font-bold">{courseT(courseId)}</span>
                                        <Link
                                            href={`/${locale}/courses`}
                                            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[var(--text-light)] transition hover:text-[var(--text-on-warm)]"
                                        >
                                            {t("actions.explorePrograms")}
                                            <ArrowRight size={15} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </section>
    );
}
