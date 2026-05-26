"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight, CalendarDays, ClipboardList, Handshake, Layers3, ShieldCheck } from "lucide-react";
import { memberCourseCategories, memberCourses } from "@/data";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import styles from "./Courses.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

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
      <motion.div
        className={styles.hero}
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.heroCopy} variants={fadeUp}>
          <div className={styles.heroBadge}>
            {user ? <ShieldCheck size={14} /> : <Layers3 size={14} />}
            {user ? t("labels.memberAccess") : t("labels.publicAccess")}
          </div>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.intro}>{t("intro")}</p>
        </motion.div>

        <motion.div className={styles.overviewGrid} variants={stagger}>
          {overview.map((item) => (
            <motion.div key={item.label} className={styles.overviewCard} variants={fadeUp}>
              <div className={styles.overviewValue}>{item.value}</div>
              <div className={styles.overviewLabel}>{item.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.contentGrid}
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.article className={`${styles.panel} ${styles.panelWide}`} variants={fadeUp}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelStep}>{t("labels.stepOne")}</p>
              <h2 className={styles.sectionTitle}>{t("courseTypes.title")}</h2>
            </div>
            <Layers3 className={styles.panelIcon} size={22} />
          </div>
          <p className={styles.description}>{t("courseTypes.lead")}</p>
          {user ? (
            <motion.div className={styles.catalogGrid} variants={stagger}>
              {groupedCourses.map((group) => (
                <motion.div key={group.id} className={styles.catalogCategory} variants={fadeUp}>
                  <div className={styles.catalogHead}>
                    <h3 className={styles.catalogTitle}>{group.title}</h3>
                    <p className={styles.catalogDescription}>{group.description}</p>
                  </div>
                  <div className={styles.catalogList}>
                    {group.courses.map((course) => (
                      <motion.div
                        key={course.id}
                        className={styles.catalogCard}
                        variants={fadeUp}
                        whileHover={{ y: -4 }}
                      >
                        <div className={styles.catalogMain}>
                          <p className={styles.catalogCourseTitle}>{courseCatalog(course.id)}</p>
                          <div className={styles.catalogMetaRow}>
                            {course.durationMinutes ? (
                              <span className={styles.metaChip}>
                                {t("courseTypes.meta.duration", { count: course.durationMinutes })}
                              </span>
                            ) : null}
                            {course.unlocksPerWeek ? (
                              <span className={styles.metaChipWarm}>
                                {t("courseTypes.meta.unlocks", { count: course.unlocksPerWeek })}
                              </span>
                            ) : null}
                            <span className={styles.metaChipOutline}>
                              {packages(course.packageRequired)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.catalogAside}>
                          {course.noteKey ? <p className={styles.catalogNote}>{t(`courseTypes.notes.${course.noteKey}`)}</p> : null}
                          {course.coach ? <p className={styles.catalogNote}>{t("courseTypes.meta.coach", { name: course.coach })}</p> : null}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
        </motion.article>

        <motion.article className={styles.panel} variants={fadeUp}>
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
        </motion.article>

        <motion.article id="consultation" className={styles.panel} variants={fadeUp}>
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
        </motion.article>

        <motion.article className={styles.panel} variants={fadeUp}>
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
        </motion.article>

        <motion.article className={`${styles.panel} ${styles.panelWide}`} variants={fadeUp}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelStep}>{t("labels.stepFive")}</p>
              <h2 className={styles.sectionTitle}>{t("businessCooperation.title")}</h2>
            </div>
            <Handshake className={styles.panelIcon} size={22} />
          </div>
          <p className={styles.description}>{t("businessCooperation.description")}</p>
        </motion.article>
      </motion.div>
      {!user ? (
        <div className={styles.memberCallout}>
          <MemberAccessCallout onSignIn={openAuth} />
        </div>
      ) : null}
    </section>
  );
}
