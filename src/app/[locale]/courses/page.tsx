"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "../components/AuthProvider";
import MemberAccessCallout from "../components/MemberAccessCallout";
import styles from "./Courses.module.css";

export default function CoursesPage() {
  const t = useTranslations("courses");
  const gate = useTranslations("memberAccess");
  const { user, openAuth } = useAuth();
  const courseTypes = t.raw("courseTypes.items") as string[];
  const consultationItems = t.raw("consultation.items") as string[];
  const questionnaire = t.raw("annualTraining.questionnaire") as string[];

  return (
    <section className={styles.coursesSection}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <h2 className={styles.sectionTitle}>{t("courseTypes.title")}</h2>
          <ul className={styles.list}>
            {courseTypes.map((item) => (
              <li key={item} className={styles.listItem}>{item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.panel}>
          <h2 className={styles.sectionTitle}>{t("liveTrainings.title")}</h2>
          {user ? (
            <p className={styles.description}>{t("liveTrainings.description")}</p>
          ) : (
            <div className={styles.lockedBlock}>
              <p className={styles.description}>{t("liveTrainings.description")}</p>
              <p className={styles.lockedNote}>{gate("liveTrainingNote")}</p>
            </div>
          )}
          <h2 className={styles.sectionTitle}>{t("liveSeminars.title")}</h2>
          {user ? (
            <p className={styles.description}>{t("liveSeminars.description")}</p>
          ) : (
            <div className={styles.lockedBlock}>
              <p className={styles.description}>{t("liveSeminars.description")}</p>
              <p className={styles.lockedNote}>{gate("liveSeminarNote")}</p>
            </div>
          )}
        </article>

        <article id="consultation" className={styles.panel}>
          <h2 className={styles.sectionTitle}>{t("consultation.title")}</h2>
          {user ? (
            <>
              <p className={styles.description}>{t("consultation.description")}</p>
              <ul className={styles.list}>
                {consultationItems.map((item) => (
                  <li key={item} className={styles.listItem}>{item}</li>
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
          <h2 className={styles.sectionTitle}>{t("annualTraining.title")}</h2>
          <p className={styles.description}>{t("annualTraining.description")}</p>
          <h3 className={styles.subTitle}>{t("annualTraining.questionnaireTitle")}</h3>
          <ol className={styles.numberedList}>
            {questionnaire.map((item) => (
              <li key={item} className={styles.listItem}>{item}</li>
            ))}
          </ol>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <h2 className={styles.sectionTitle}>{t("businessCooperation.title")}</h2>
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
