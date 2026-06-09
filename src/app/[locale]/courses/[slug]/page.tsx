import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Dumbbell, PlayCircle, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { memberCourses, type MemberCourseDefinition } from "@/data";
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
  "weight-reduction": "overweight",
  "weight-loss": "overweight",
  abnehmen: "overweight",
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

function canonicalCategory(slug: unknown) {
  const key = Array.isArray(slug) ? slug[0] : slug;

  if (typeof key !== "string") return "";

  return categoryAliases[key] ?? key;
}

function getSubtypeVideos(courses: CourseSummary[], subtype: MemberCourseDefinition, categorySlug: string) {
  const categorySubtypes = memberCourses.filter((course) => canonicalCategory(course.categoryKey) === categorySlug);
  const subtypeIds = new Set(categorySubtypes.map((course) => course.id));
  const plannedOnlyIds = new Set(memberCourses.map((course) => course.id));
  const categoryItems = courses.filter(
    (course) => canonicalCategory(course.categoryKey) === categorySlug && !(plannedOnlyIds.has(course.id) && !course.hasVideo),
  );
  const directMatches = categoryItems.filter((course) => course.subcategoryKey === subtype.id || course.slug === subtype.id);
  const isFallbackSubtype = categorySubtypes[0]?.id === subtype.id;

  if (!isFallbackSubtype) return directMatches;

  const fallbackMatches = categoryItems.filter(
    (course) => course.subcategoryKey === "" || !subtypeIds.has(course.subcategoryKey),
  );

  return Array.from(new Map([...directMatches, ...fallbackMatches].map((course) => [course.id, course])).values());
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
    const subtypes = memberCourses.filter((course) => canonicalCategory(course.categoryKey) === categorySlug);
    const subtypeCards = subtypes.map((subtype) => {
      const videos = getSubtypeVideos(courses, subtype, categorySlug);
      const availableVideoCount = videos.filter((video) => video.hasVideo).length;
      const liveVideoCount = videos.filter((video) => video.isLive).length;
      const plannedTrainingCount = subtype.plannedTrainingCount ?? videos.length;

      return {
        subtype,
        videos,
        availableVideoCount,
        liveVideoCount,
        plannedTrainingCount,
      };
    });
    const availableVideoCount = subtypeCards.reduce((total, card) => total + card.availableVideoCount, 0);

    if (!subtypeCards.length) notFound();

    const getCourseNote = (course: MemberCourseDefinition) => {
      if (!course.noteKey) return "";
      if (translatedNoteKeys.has(course.noteKey)) return coursesT(`courseTypes.notes.${course.noteKey}`);
      return course.noteKey;
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
            <strong>{coursesT("courseTypes.meta.videoCount", { count: availableVideoCount })}</strong>
            <p>{coursesT("courseTypes.meta.subtypeCount", { count: subtypeCards.length })}</p>
          </aside>
        </header>

        <div className={coursesStyles.subtypeList}>
          {subtypeCards.map(({ subtype, videos, availableVideoCount, liveVideoCount, plannedTrainingCount }) => {
            const courseNote = getCourseNote(subtype);
            const cardContent = (
              <>
                {liveVideoCount ? (
                  <span className={coursesStyles.liveBadge}>{coursesT("courseTypes.meta.live")}</span>
                ) : availableVideoCount ? (
                  <span className={coursesStyles.videoBadge}>{coursesT("courseTypes.meta.newThisWeek")}</span>
                ) : null}
                <div>
                  <h2 className={coursesStyles.courseTitle}>{courseT(subtype.id)}</h2>
                  {courseNote || subtype.coach ? (
                    <p className={coursesStyles.courseDescription}>
                      {courseNote}
                      {courseNote && subtype.coach ? " · " : ""}
                      {subtype.coach ? coursesT("courseTypes.meta.coach", { name: subtype.coach }) : null}
                    </p>
                  ) : null}
                </div>
                <div className={coursesStyles.courseMeta}>
                  <span>{coursesT("courseTypes.meta.videoCount", { count: availableVideoCount })}</span>
                  <span>{coursesT("weeklyUnlock.title")}</span>
                  <span>{coursesT("courseTypes.meta.plannedCount", { count: plannedTrainingCount })}</span>
                  {subtype.durationMinutes ? (
                    <span>{coursesT("courseTypes.meta.duration", { count: subtype.durationMinutes })}</span>
                  ) : null}
                  {subtype.unlocksPerWeek ? (
                    <span>{coursesT("courseTypes.meta.unlocks", { count: subtype.unlocksPerWeek })}</span>
                  ) : null}
                  <span>{packages(subtype.packageRequired)}</span>
                </div>
              </>
            );

            if (!videos.length) {
              return (
                <article key={subtype.id} className={`${coursesStyles.courseCard} ${coursesStyles.courseCardUnavailable}`}>
                  {cardContent}
                </article>
              );
            }

            return (
              <Link key={subtype.id} href={`/${locale}/courses/${categorySlug}/${subtype.id}`} className={coursesStyles.courseCard}>
                {cardContent}
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
          courseSlug={course.slug}
          locale={locale}
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

          {instructionParagraphs.length ? (
            <section className={styles.instructions}>
              <h2>{t("instructionsTitle")}</h2>
              {instructionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ) : null}
        </div>

        <aside className={styles.metaPanel}>
          <div className={styles.metaItem}>
            <PlayCircle size={17} />
            <span>{course.muxPlaybackId ? t("meta.videoAvailable") : t("meta.videoPending")}</span>
          </div>
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
