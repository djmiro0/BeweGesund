import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Dumbbell, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCourseDetail } from "@/lib/contentful";
import ProtectedMuxPlayer from "./ProtectedMuxPlayer";
import styles from "./CourseDetail.module.css";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const course = await getCourseDetail(locale, slug);
  const packages = await getTranslations({ locale, namespace: "packages" });
  const t = await getTranslations({ locale, namespace: "courseDetail" });

  if (!course) notFound();

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
          title={course.title}
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
            <h1 className={styles.title}>{course.title}</h1>
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
