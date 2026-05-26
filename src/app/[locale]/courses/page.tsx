"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, CalendarDays, ClipboardList, Handshake, Layers3, ShieldCheck } from "lucide-react";
import { memberCourseCategories, memberCourses } from "@/data";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import styles from "./Courses.module.css";

export default function CoursesPage() {
  const t = useTranslations("courses");
  const gate = useTranslations("memberAccess");
  const courseCatalog = useTranslations("courseCatalog");
  const packages = useTranslations("packages");
  const { user, openAuth } = useAuth();
  const courseTypes = t.raw("courseTypes.items") as string[];
  const consultationItems = t.raw("consultation.items") as string[];
  const questionnaire = t.raw("annualTraining.questionnaire") as string[];
  const overview = t.raw("overview.items") as Array<{ label: string; value: string }>;
  const groupedCourses = memberCourseCategories.map((category) => ({
    id: category.id,
    title: t(`courseTypes.categories.${category.id}.title`),
    description: t(`courseTypes.categories.${category.id}.description`),
    courses: category.courseIds
      .map((courseId) => memberCourses.find((course) => course.id === courseId))
      .filter((course): course is (typeof memberCourses)[number] => course !== undefined),
  }));

  return (
    <section className={styles.coursesSection}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>
            {user ? <ShieldCheck size={14} /> : <Layers3 size={14} />}
            {user ? t("labels.memberAccess") : t("labels.publicAccess")}
          </div>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.intro}>{t("intro")}</p>
        </div>

        <div className={styles.overviewGrid}>
          {overview.map((item) => (
            <div key={item.label} className={styles.overviewCard}>
              <div className={styles.overviewValue}>{item.value}</div>
              <div className={styles.overviewLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelStep}>{t("labels.stepOne")}</p>
              <h2 className={styles.sectionTitle}>{t("courseTypes.title")}</h2>
            </div>
            <Layers3 className={styles.panelIcon} size={22} />
          </div>
          <p className={styles.description}>{t("courseTypes.lead")}</p>
          {user ? (
            <div className="mt-8 flex flex-col gap-6">
              {groupedCourses.map((group) => (
                <div key={group.id} className="rounded-[1.7rem] border border-[rgba(var(--foreground-rgb),0.12)] bg-[rgba(var(--navy-rgb),0.36)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.14)]">
                  <div className="mb-4 border-b border-[var(--border-soft)] pb-4">
                    <h3 className="text-xl font-black uppercase italic text-[var(--text-light)]">{group.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{group.description}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex flex-col gap-3 rounded-[1.3rem] border border-[rgba(var(--foreground-rgb),0.1)] bg-[rgba(var(--foreground-rgb),0.04)] px-4 py-4 md:flex-row md:items-start md:justify-between"
                      >
                        <div className="max-w-2xl">
                          <p className="text-base font-bold text-[var(--text-light)]">{courseCatalog(course.id)}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {course.durationMinutes ? (
                              <span className="rounded-full bg-[rgba(var(--accent-soft-rgb),0.14)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--highlight-soft)]">
                                {t("courseTypes.meta.duration", { count: course.durationMinutes })}
                              </span>
                            ) : null}
                            {course.unlocksPerWeek ? (
                              <span className="rounded-full bg-[rgba(var(--accent-rgb),0.12)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--text-light)]">
                                {t("courseTypes.meta.unlocks", { count: course.unlocksPerWeek })}
                              </span>
                            ) : null}
                            <span className="rounded-full border border-[rgba(var(--foreground-rgb),0.1)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--text-dim)]">
                              {packages(course.packageRequired)}
                            </span>
                          </div>
                        </div>
                        <div className="max-w-sm text-sm leading-7 text-[var(--text-muted)] md:text-right">
                          {course.noteKey ? <p>{t(`courseTypes.notes.${course.noteKey}`)}</p> : null}
                          {course.coach ? <p>{t("courseTypes.meta.coach", { name: course.coach })}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className={styles.list}>
              {courseTypes.map((item) => (
                <li key={item} className={styles.listItem}>
                  <span className={styles.listMarker} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelStep}>{t("labels.stepTwo")}</p>
              <h2 className={styles.sectionTitle}>{t("liveTrainings.title")}</h2>
            </div>
            <CalendarDays className={styles.panelIcon} size={22} />
          </div>
          {user ? (
            <div className={styles.liveStack}>
              <div className={styles.infoBlock}>
                <h3 className={styles.infoTitle}>{t("liveTrainings.title")}</h3>
                <p className={styles.description}>{t("liveTrainings.description")}</p>
              </div>
              <div className={styles.infoBlock}>
                <h3 className={styles.infoTitle}>{t("liveSeminars.title")}</h3>
                <p className={styles.description}>{t("liveSeminars.description")}</p>
              </div>
            </div>
          ) : (
            <div className={styles.liveStack}>
              <div className={styles.lockedBlock}>
                <h3 className={styles.infoTitle}>{t("liveTrainings.title")}</h3>
                <p className={styles.description}>{t("liveTrainings.description")}</p>
                <p className={styles.lockedNote}>{gate("liveTrainingNote")}</p>
              </div>
              <div className={styles.lockedBlock}>
                <h3 className={styles.infoTitle}>{t("liveSeminars.title")}</h3>
                <p className={styles.description}>{t("liveSeminars.description")}</p>
                <p className={styles.lockedNote}>{gate("liveSeminarNote")}</p>
              </div>
            </div>
          )}
        </article>

        <article id="consultation" className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelStep}>{t("labels.stepThree")}</p>
              <h2 className={styles.sectionTitle}>{t("consultation.title")}</h2>
            </div>
            <ArrowUpRight className={styles.panelIcon} size={22} />
          </div>
          {user ? (
            <>
              <p className={styles.description}>{t("consultation.lead")}</p>
              <p className={styles.description}>{t("consultation.description")}</p>
              <ul className={styles.list}>
                {consultationItems.map((item) => (
                  <li key={item} className={styles.listItem}>
                    <span className={styles.listMarker} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className={styles.lockedBlock}>
              <p className={styles.description}>{gate("consultationNote")}</p>
              <button onClick={openAuth} className={styles.inlineButton}>{gate("cta")}</button>
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelStep}>{t("labels.stepFour")}</p>
              <h2 className={styles.sectionTitle}>{t("annualTraining.title")}</h2>
            </div>
            <ClipboardList className={styles.panelIcon} size={22} />
          </div>
          <p className={styles.description}>{t("annualTraining.description")}</p>
          <h3 className={styles.subTitle}>{t("annualTraining.questionnaireTitle")}</h3>
          <p className={styles.description}>{t("annualTraining.questionnaireLead")}</p>
          <ol className={styles.numberedList}>
            {questionnaire.map((item) => (
              <li key={item} className={styles.numberedItem}>{item}</li>
            ))}
          </ol>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelStep}>{t("labels.stepFive")}</p>
              <h2 className={styles.sectionTitle}>{t("businessCooperation.title")}</h2>
            </div>
            <Handshake className={styles.panelIcon} size={22} />
          </div>
          <p className={styles.description}>{t("businessCooperation.description")}</p>
        </article>
      </div>
      {!user ? (
        <div className={styles.memberCallout}>
          <MemberAccessCallout onSignIn={openAuth} />
        </div>
      ) : null}
    </section>
  );
}
