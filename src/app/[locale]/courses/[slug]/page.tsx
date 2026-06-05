import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Dumbbell, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { memberCourses } from "@/data";
import { getCourseDetail, getCourses, type CourseSummary } from "@/lib/contentful";
import ProtectedMuxPlayer from "./ProtectedMuxPlayer";
import styles from "./CourseDetail.module.css";
import coursesStyles from "../Courses.module.css";

const categorySlugs = new Set([
  "reha",
  "healthy-living",
  "overweight",
  "intensive",
  "pre-post-birth",
  "corporate-fitness",
]);

const categoryAliases: Record<string, string> = {
  definition: "intensive",
};

const translatedNoteKeys = new Set([
  "package20",
  "package22",
  "repeat2to3",
  "repeatDaily",
  "videoAndDocs",
  "onlineOnly",
  "premiumRecommended",
  "comingLater",
]);

function canonicalCategory(slug: string) {
  return categoryAliases[slug] ?? slug;
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const packages = await getTranslations({ locale, namespace: "packages" });
  const t = await getTranslations({ locale, namespace: "courseDetail" });
  const coursesT = await getTranslations({ locale, namespace: "courses" });
  const courseT = await getTranslations({ locale, namespace: "courseCatalog" });
  const categorySlug = canonicalCategory(slug);

  if (categorySlugs.has(categorySlug)) {
    const courses = await getCourses(locale);
    const categoryCourses = courses.filter((course) => canonicalCategory(course.categoryKey) === categorySlug);

    if (!categoryCourses.length) notFound();

    const getCourseTitle = (course: CourseSummary) => {
      if (course.title === course.id || course.title === course.slug) {
        return courseT(course.id);
      }

      return course.title;
    };

    const getCourseNote = (course: CourseSummary) => {
      if (!course.note) return "";
      if (translatedNoteKeys.has(course.note)) return coursesT(`courseTypes.notes.${course.note}`);
      return course.note;
    };

    return (
      <section className={coursesStyles.coursesSection}>
        <Link href={`/${locale}/courses`} className={styles.backLink}>
          <ArrowLeft size={17} />
          {t("back")}
        </Link>

        <header className={coursesStyles.hero}>
          <div className={coursesStyles.heroCopy}>
            <div className={coursesStyles.heroStatus}>
              <Dumbbell size={15} />
              {coursesT("weeklyUnlock.label")}
            </div>
            <h1 className={coursesStyles.title}>{coursesT(`courseTypes.categories.${categorySlug}.title`)}</h1>
            <p className={coursesStyles.intro}>{coursesT(`courseTypes.categories.${categorySlug}.description`)}</p>
          </div>

          <aside className={coursesStyles.unlockPanel}>
            <p className={coursesStyles.unlockLabel}>{coursesT("weeklyUnlock.label")}</p>
            <strong>{coursesT("weeklyUnlock.title")}</strong>
            <p>{categorySlug === "reha" ? coursesT("weeklyUnlock.reha") : coursesT("weeklyUnlock.description")}</p>
          </aside>
        </header>

        <div className={coursesStyles.subtypeList}>
          {categoryCourses.map((course) => {
            const courseNote = getCourseNote(course);

            return (
              <Link key={course.id} href={`/${locale}/courses/${course.slug}`} className={coursesStyles.courseCard}>
                <div>
                  <h2 className={coursesStyles.courseTitle}>{getCourseTitle(course)}</h2>
                  {course.description ? (
                    <p className={coursesStyles.courseDescription}>{course.description}</p>
                  ) : null}
                  {courseNote || course.coach ? (
                    <p className={coursesStyles.courseDescription}>
                      {courseNote}
                      {courseNote && course.coach ? " · " : ""}
                      {course.coach ? coursesT("courseTypes.meta.coach", { name: course.coach }) : null}
                    </p>
                  ) : null}
                </div>
                <div className={coursesStyles.courseMeta}>
                  {course.durationMinutes ? (
                    <span>{coursesT("courseTypes.meta.duration", { count: course.durationMinutes })}</span>
                  ) : null}
                  {course.unlocksPerWeek ? (
                    <span>{coursesT("courseTypes.meta.unlocks", { count: course.unlocksPerWeek })}</span>
                  ) : null}
                  <span>{packages(course.packageRequired)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const course = await getCourseDetail(locale, slug);

  if (!course) notFound();

  const knownCourse = memberCourses.some((memberCourse) => memberCourse.id === course.id || memberCourse.id === course.slug);
  const courseTitle = knownCourse && (course.title === course.id || course.title === course.slug)
    ? courseT(course.slug)
    : course.title;
  const instructionParagraphs = course.exerciseInstructions
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className={styles.page}>
      <Link href={`/${locale}/courses`} className={styles.backLink}>
        <ArrowLeft size={17} />
        {t("back")}
      </Link>

      <section className={styles.videoPanel}>
        <ProtectedMuxPlayer
          playbackId={course.muxPlaybackId}
          poster={course.posterImage}
          title={courseTitle}
          messages={{
            videoPending: t("player.videoPending"),
            preparingVideo: t("player.preparingVideo"),
            signInRequired: t("player.signInRequired"),
            tokenError: t("player.tokenError"),
            signingMissing: t("player.signingMissing"),
            authError: t("player.authError"),
          }}
        />
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.titleBlock}>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1 className={styles.title}>{courseTitle}</h1>
            {course.description ? <p className={styles.description}>{course.description}</p> : null}
          </div>

          <section className={styles.instructions}>
            <h2>{t("instructionsTitle")}</h2>
            {instructionParagraphs.length ? (
              instructionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            ) : (
              <p>{t("instructionsFallback")}</p>
            )}
          </section>
        </div>

        <aside className={styles.metaPanel}>
          <div className={styles.metaItem}>
            <Clock size={17} />
            <span>{course.duration || t("meta.flexibleDuration")}</span>
          </div>
          <div className={styles.metaItem}>
            <Dumbbell size={17} />
            <span>{course.level || t("meta.training")}</span>
          </div>
          <div className={styles.metaItem}>
            <ShieldCheck size={17} />
            <span>{packages(course.packageRequired)}</span>
          </div>
          {course.coach ? (
            <div className={styles.metaItem}>
              <UserRound size={17} />
              <span>{course.coach}</span>
            </div>
          ) : null}
        </aside>
      </section>
    </article>
  );
}
