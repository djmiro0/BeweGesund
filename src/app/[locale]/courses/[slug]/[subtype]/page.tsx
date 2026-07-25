import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { memberCourses, type MemberCourseDefinition } from "@/data";
import { getCourses, type CourseSummary } from "@/lib/contentful";
import BackButton from "../../../components/BackButton";
import detailStyles from "../CourseDetail.module.css";
import coursesStyles from "../../Courses.module.css";

const categoryAliases: Record<string, string> = {
  "weight-reduction": "overweight",
  "weight-loss": "overweight",
  abnehmen: "overweight",
  definition: "intensive",
};

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

function getSubtypeVideos(
  courses: CourseSummary[],
  subtype: MemberCourseDefinition,
  categorySlug: string,
) {
  const categorySubtypes = memberCourses.filter(
    (course) => canonicalCategory(course.categoryKey) === categorySlug,
  );
  const subtypeIds = new Set(categorySubtypes.map((course) => course.id));
  const plannedOnlyIds = new Set(memberCourses.map((course) => course.id));
  const categoryItems = courses.filter(
    (course) =>
      canonicalCategory(course.categoryKey) === categorySlug &&
      !(plannedOnlyIds.has(course.id) && !course.hasVideo),
  );
  const directMatches = categoryItems.filter(
    (course) =>
      course.subcategoryKey === subtype.id || course.slug === subtype.id,
  );
  const isFallbackSubtype = categorySubtypes[0]?.id === subtype.id;

  if (!isFallbackSubtype) return directMatches;

  const fallbackMatches = categoryItems.filter(
    (course) =>
      course.subcategoryKey === "" || !subtypeIds.has(course.subcategoryKey),
  );

  return Array.from(
    new Map(
      [...directMatches, ...fallbackMatches].map((course) => [
        course.id,
        course,
      ]),
    ).values(),
  );
}

export default async function CourseSubtypePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; subtype: string }>;
}) {
  const { locale, slug, subtype } = await params;
  const categorySlug = canonicalCategory(slug);
  const coursesT = await getTranslations({ locale, namespace: "courses" });
  const courseT = await getTranslations({ locale, namespace: "courseCatalog" });
  const packages = await getTranslations({ locale, namespace: "packages" });
  const t = await getTranslations({ locale, namespace: "courseDetail" });
  const subtypeDefinition = memberCourses.find(
    (course) =>
      course.id === subtype &&
      canonicalCategory(course.categoryKey) === categorySlug,
  );

  if (!subtypeDefinition) notFound();

  const courses = await getCourses(locale);
  const videos = getSubtypeVideos(courses, subtypeDefinition, categorySlug);
  const plannedTrainingCount =
    subtypeDefinition.plannedTrainingCount ?? videos.length;
  const availableVideoCount = videos.filter((video) => video.hasVideo).length;

  return (
    <section className={coursesStyles.coursesSection}>
      <BackButton
        href={`/${locale}/courses/${categorySlug}`}
        className={detailStyles.backLink}
      >
        <ArrowLeft size={17} />
        {t("back")}
      </BackButton>

      <header className={coursesStyles.hero}>
        <div className={coursesStyles.heroCopy}>
          <div className={coursesStyles.heroStatus}>
            <Dumbbell size={15} />
            {coursesT(`courseTypes.categories.${categorySlug}.title`)}
          </div>
          <h1 className={coursesStyles.title}>
            {courseT(subtypeDefinition.id)}
          </h1>
          <p className={coursesStyles.intro}>
            {coursesT("weeklyUnlock.description")}
          </p>
        </div>

        <aside className={coursesStyles.unlockPanel}>
          <p className={coursesStyles.unlockLabel}>
            {coursesT("weeklyUnlock.label")}
          </p>
          <strong>
            {coursesT("courseTypes.meta.videoCount", {
              count: availableVideoCount,
            })}
          </strong>
          <p>
            {coursesT("courseTypes.meta.plannedCount", {
              count: plannedTrainingCount,
            })}
          </p>
        </aside>
      </header>

      <div className={coursesStyles.subtypeList}>
        {videos.length ? (
          videos.map((video) =>
            video.hasVideo ? (
              <Link
                key={video.id}
                href={`/${locale}/courses/${video.slug}`}
                className={`${coursesStyles.courseCard} ${coursesStyles.videoCourseCard}`}
              >
                {video.isLive ? (
                  <span className={coursesStyles.liveBadge}>
                    {coursesT("courseTypes.meta.live")}
                  </span>
                ) : isNewlyPublished(video.publishedAt) ? (
                  <span className={coursesStyles.videoBadge}>
                    {coursesT("courseTypes.meta.newThisWeek")}
                  </span>
                ) : null}
                <div className={coursesStyles.videoPoster}>
                  {video.posterImage ? (
                    <Image
                      src={video.posterImage}
                      alt=""
                      fill
                      sizes="(max-width: 720px) 100vw, 240px"
                    />
                  ) : (
                    <PlayCircle size={34} />
                  )}
                </div>
                <div className={coursesStyles.videoCardCopy}>
                  <div>
                    <h2 className={coursesStyles.courseTitle}>{video.title}</h2>
                    {video.description ? (
                      <p className={coursesStyles.courseDescription}>
                        {video.description}
                      </p>
                    ) : null}
                  </div>
                  <div className={coursesStyles.courseMeta}>
                    <span>{coursesT("courseTypes.meta.videoAvailable")}</span>
                    {video.durationMinutes ? (
                      <span>
                        <Clock size={12} />
                        {coursesT("courseTypes.meta.duration", {
                          count: video.durationMinutes,
                        })}
                      </span>
                    ) : null}
                    <span>
                      <PlayCircle size={12} />
                      {coursesT("courseTypes.meta.video")}
                    </span>
                    <span>
                      <ShieldCheck size={12} />
                      {packages(video.packageRequired)}
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <article
                key={video.id}
                className={`${coursesStyles.courseCard} ${coursesStyles.courseCardUnavailable}`}
              >
                <div>
                  <h2 className={coursesStyles.courseTitle}>{video.title}</h2>
                  {video.description ? (
                    <p className={coursesStyles.courseDescription}>
                      {video.description}
                    </p>
                  ) : null}
                </div>
                <div className={coursesStyles.courseMeta}>
                  <span>{coursesT("courseTypes.meta.comingSoon")}</span>
                  {video.durationMinutes ? (
                    <span>
                      <Clock size={12} />
                      {coursesT("courseTypes.meta.duration", {
                        count: video.durationMinutes,
                      })}
                    </span>
                  ) : null}
                  <span>
                    <ShieldCheck size={12} />
                    {packages(video.packageRequired)}
                  </span>
                </div>
              </article>
            ),
          )
        ) : (
          <article
            className={`${coursesStyles.courseCard} ${coursesStyles.courseCardUnavailable}`}
          >
            <div>
              <h2 className={coursesStyles.courseTitle}>
                {coursesT("courseTypes.meta.comingSoon")}
              </h2>
              <p className={coursesStyles.courseDescription}>
                {coursesT("courseTypes.emptyCategory")}
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
