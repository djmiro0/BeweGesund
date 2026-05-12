"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, CalendarDays, ClipboardList, Handshake, Layers3, ShieldCheck } from "lucide-react";
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
  const overview = t.raw("overview.items") as Array<{ label: string; value: string }>;

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
          <ul className={styles.list}>
            {courseTypes.map((item) => (
              <li key={item} className={styles.listItem}>
                <span className={styles.listMarker} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
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
