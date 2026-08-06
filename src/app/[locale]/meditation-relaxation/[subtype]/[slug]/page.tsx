import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  HandHeart,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getMeditationRelaxationItem } from "@/lib/contentful";
import BackButton from "../../../components/BackButton";
import { ContentRewardPanel } from "../../../components/ContentReward";
import ProtectedMuxPlayer from "../../../courses/[slug]/ProtectedMuxPlayer";
import blogStyles from "../../../blogs/Blogs.module.css";
import styles from "../../Relaxation.module.css";

const relaxationSubcategoryKeys = new Set([
  "guided-meditation",
  "relaxation-music",
  "breathing-against-stress",
  "self-massage-stress-reduction",
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

  if (!item || (item.subcategoryKey && item.subcategoryKey !== subtype))
    notFound();

  const isSelfMassage = subtype === "self-massage-stress-reduction";
  const instructionParagraphs = item.instructions
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const rewardLabels =
    locale === "de"
      ? {
          title: "Entspannungs-Bonus",
          locked: "Fortschritt {percent}% / 50%.",
          available: "Bonus verfügbar. Punkte werden gesammelt.",
          claimed: "Abgeschlossen. Punkte gesammelt.",
          dailyLimit: "Tägliches Limit erreicht.",
          signIn: "Melde dich an, um Punkte zu sammeln.",
          xp: "+{points} XP",
          claim: "Punkte sammeln",
          claiming: "Sammeln...",
        }
      : {
          title: "Relaxation bonus",
          locked: "Progress {percent}% / 50%.",
          available: "Reward available. Collecting points.",
          claimed: "Completed. Points collected.",
          dailyLimit: "Daily limit reached.",
          signIn: "Sign in to collect points.",
          xp: "+{points} XP",
          claim: "Collect points",
          claiming: "Collecting...",
        };
  const rewardTarget = {
    contentId: `relaxation_${locale}_${item.slug}`,
    contentType: "relaxation" as const,
    durationSeconds: item.durationMinutes
      ? item.durationMinutes * 60
      : undefined,
    points: 30,
    labels: rewardLabels,
  };

  if (isSelfMassage) {
    return (
      <article className={`${blogStyles.articlePage} ${styles.subpage}`}>
        <BackButton
          href={`/${locale}/meditation-relaxation/${subtype}`}
          className={styles.backLink}
        >
          <ArrowLeft size={17} />
          {t("subtype.back")}
        </BackButton>

        <header className={blogStyles.articleHeader}>
          <h1 className={blogStyles.articleTitle}>{item.title}</h1>
          {item.description ? (
            <p className={blogStyles.articleExcerpt}>{item.description}</p>
          ) : null}
          <div className={blogStyles.postMeta}>
            {item.coach ? (
              <span>
                <UserRound size={14} />
                {item.coach}
              </span>
            ) : null}
            {item.durationMinutes ? (
              <span>
                <Clock size={14} />
                {t("videos.duration", { count: item.durationMinutes })}
              </span>
            ) : null}
            {item.level ? (
              <span>
                <Sparkles size={14} />
                {item.level}
              </span>
            ) : null}
            <span>
              <ShieldCheck size={14} />
              {packages(item.packageRequired)}
            </span>
          </div>
        </header>

        <div className={blogStyles.articleImageWrap}>
          {item.posterImage ? (
            <Image
              src={item.posterImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 1120px, 100vw"
              className={blogStyles.articleImage}
              priority
            />
          ) : (
            <span className={blogStyles.imageFallback} aria-hidden="true">
              <HandHeart size={38} />
            </span>
          )}
        </div>

        {instructionParagraphs.length ? (
          <div className={blogStyles.articleBody}>
            <h2>{t("detail.instructionsTitle")}</h2>
            {instructionParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <main className={`${styles.page} ${styles.subpage}`}>
      <BackButton
        href={`/${locale}/meditation-relaxation/${subtype}`}
        className={styles.backLink}
      >
        <ArrowLeft size={17} />
        {t("subtype.back")}
      </BackButton>

      <section className={styles.detailVideoPanel}>
        <ProtectedMuxPlayer
          playbackId={item.muxPlaybackId}
          courseSlug={item.slug}
          contentType="meditationRelaxation"
          locale={locale}
          poster={item.posterImage}
          title={item.title}
          trainerId={item.coach}
          reward={rewardTarget}
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
              {instructionParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </article>

        <aside className={styles.detailMeta}>
          <ContentRewardPanel target={rewardTarget} />
          <span>
            <PlayCircle size={15} />
            {item.muxPlaybackId
              ? t("detail.videoAvailable")
              : t("player.videoPending")}
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
