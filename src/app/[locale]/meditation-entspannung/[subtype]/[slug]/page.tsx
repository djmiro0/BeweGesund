import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, PlayCircle, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getMeditationRelaxationItem } from "@/lib/contentful";
import ProtectedMuxPlayer from "../../../courses/[slug]/ProtectedMuxPlayer";
import styles from "../../Relaxation.module.css";

const relaxationSubcategoryKeys = new Set([
  "guided-meditation",
  "relaxation-music",
  "breathing-against-stress",
]);

export default async function MeditationRelaxationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; subtype: string; slug: string }>;
}) {
  const { locale, subtype, slug } = await params;

  if (!relaxationSubcategoryKeys.has(subtype)) notFound();

  const [t, packages, item] = await Promise.all([
    getTranslations({ locale, namespace: "relaxation" }),
    getTranslations({ locale, namespace: "packages" }),
    getMeditationRelaxationItem(locale, slug),
  ]);

  if (!item || (item.subcategoryKey && item.subcategoryKey !== subtype)) notFound();

  const instructionParagraphs = item.instructions
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className={styles.page}>
      <Link href={`/${locale}/meditation-entspannung/${subtype}`} className={styles.backLink}>
        <ArrowLeft size={17} />
        {t("subtype.back")}
      </Link>

      <section className={styles.detailVideoPanel}>
        <ProtectedMuxPlayer
          playbackId={item.muxPlaybackId}
          courseSlug={item.slug}
          contentType="meditationRelaxation"
          locale={locale}
          poster={item.posterImage}
          title={item.title}
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

      <section className={styles.detailGrid}>
        <article className={styles.detailContent}>
          <p className={styles.eyebrow}>{t("title")}</p>
          <h1>{item.title}</h1>
          {item.description ? <p>{item.description}</p> : null}

          {instructionParagraphs.length ? (
            <div className={styles.instructions}>
              <h2>{t("detail.instructionsTitle")}</h2>
              {instructionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ) : null}
        </article>

        <aside className={styles.detailMeta}>
          <span>
            <PlayCircle size={15} />
            {item.muxPlaybackId ? t("detail.videoAvailable") : t("player.videoPending")}
          </span>
          {item.durationMinutes ? (
            <span>
              <Clock size={15} />
              {t("videos.duration", { count: item.durationMinutes })}
            </span>
          ) : null}
          {item.level ? (
            <span>
              <Sparkles size={15} />
              {item.level}
            </span>
          ) : null}
          <span>
            <ShieldCheck size={15} />
            {packages(item.packageRequired)}
          </span>
          {item.coach ? (
            <span>
              <UserRound size={15} />
              {item.coach}
            </span>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
