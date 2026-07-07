import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Dumbbell, PlayCircle, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { memberCourses, type MemberCourseDefinition } from "@/data";
import { getCourseDetail, getCourses, type CourseSummary } from "@/lib/contentful";
import BackButton from "../../components/BackButton";
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
  "live-courses",
  "live-seminars",
  "nutrition-seminars",
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

const newBadgeWindowMs = 3 * 24 * 60 * 60 * 1000;

function canonicalCategory(slug: unknown) {
  const key = Array.isArray(slug) ? slug[0] : slug;

  if (typeof key !== "string") return "";

  return categoryAliases[key] ?? key;
}

function isNewlyPublished(publishedAt: string) {
  if (!publishedAt) return false;

  const publishedTime = new Date(publishedAt).getTime();
  if (!Number.isFinite(publishedTime)) return false;

  const ageMs = Date.now() - publishedTime;

  return ageMs >= 0 && ageMs < newBadgeWindowMs;
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

    const getCourseNote = (course: MemberCourseDefinition) => {
      if (!course.noteKey) return "";
      if (translatedNoteKeys.has(course.noteKey)) return coursesT(`courseTypes.notes.${course.noteKey}`);
      return course.noteKey;
    };

    const categoryItems = courses.filter((course) => canonicalCategory(course.categoryKey) === categorySlug);

    if (!subtypeCards.length && !categoryItems.length) notFound();

    if (!subtypeCards.length) {
      return (
        <section className={coursesStyles.coursesSection}>
          <BackButton href={`/${locale}/courses`} className={styles.backLink}>
            <ArrowLeft size={17} />
            {t("back")}
          </BackButton>

          <header className={coursesStyles.hero}>
            <div className={coursesStyles.heroCopy}>
              <div className={coursesStyles.heroStatus}>
                <Dumbbell size={15} />
                {coursesT("courseTypes.meta.live")}
              </div>
              <h1 className={coursesStyles.title}>{coursesT(`courseTypes.categories.${categorySlug}.title`)}</h1>
              <p className={coursesStyles.intro}>{coursesT(`courseTypes.categories.${categorySlug}.description`)}</p>
            </div>
          </header>

          <div className={coursesStyles.subtypeList}>
            {categoryItems.map((course) => (
              <Link key={course.id} href={`/${locale}/courses/${course.slug}`} className={coursesStyles.courseCard}>
                {course.isLive ? (
                  <span className={coursesStyles.liveBadge}>{coursesT("courseTypes.meta.live")}</span>
                ) : null}
                <div>
                  <h2 className={coursesStyles.courseTitle}>{course.title}</h2>
                  {course.description ? (
                    <p className={coursesStyles.courseDescription}>{course.description}</p>
                  ) : null}
                </div>
                <div className={coursesStyles.courseMeta}>
                  {course.durationMinutes ? (
                    <span>{coursesT("courseTypes.meta.duration", { count: course.durationMinutes })}</span>
                  ) : null}
                  {course.coach ? (
                    <span>{coursesT("courseTypes.meta.coach", { name: course.coach })}</span>
                  ) : null}
                  <span>{packages(course.packageRequired)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className={coursesStyles.coursesSection}>
        <BackButton href={`/${locale}/courses`} className={styles.backLink}>
          <ArrowLeft size={17} />
          {t("back")}
        </BackButton>

        <header className={coursesStyles.hero}>
          <div className={coursesStyles.heroCopy}>
            <div className={coursesStyles.heroStatus}>
              <Dumbbell size={15} />
              {coursesT("weeklyUnlock.label")}
            </div>
            <h1 className={coursesStyles.title}>{coursesT(`courseTypes.categories.${categorySlug}.title`)}</h1>
            <p className={coursesStyles.intro}>{coursesT(`courseTypes.categories.${categorySlug}.description`)}</p>
          </div>
        </header>

        <div className={coursesStyles.subtypeList}>
          {subtypeCards.map(({ subtype, videos, availableVideoCount, liveVideoCount }) => {
            const courseNote = getCourseNote(subtype);
            const hasNewVideo = videos.some((video) => video.hasVideo && isNewlyPublished(video.publishedAt));
            const cardContent = (
              <>
                {liveVideoCount ? (
                  <span className={coursesStyles.liveBadge}>{coursesT("courseTypes.meta.live")}</span>
                ) : hasNewVideo ? (
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
                  {subtype.durationMinutes ? (
                    <span>{coursesT("courseTypes.meta.duration", { count: subtype.durationMinutes })}</span>
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
      <BackButton href={`/${locale}/courses`} className={styles.backLink}>
        <ArrowLeft size={17} />
        {t("back")}
      </BackButton>

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
            subscriptionRequired: t("player.subscriptionRequired"),
            packageRequired: t("player.packageRequired"),
            videoNotFound: t("player.videoNotFound"),
            accessCheckFailed: t("player.accessCheckFailed"),
            rateLimited: t("player.rateLimited"),
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
