import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, HandHeart, PlayCircle, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getMeditationRelaxationItems, type MeditationRelaxationItem } from "@/lib/contentful";
import BackButton from "../../components/BackButton";
import BreathingTechniques from "./BreathingTechniques";
import RelaxationMusicPlaylist from "./RelaxationMusicPlaylist";
import blogStyles from "../../blogs/Blogs.module.css";
import styles from "../Relaxation.module.css";

const relaxationSubcategoryKeys = [
  "guided-meditation",
  "relaxation-music",
  "breathing-against-stress",
  "self-massage-stress-reduction",
] as const;

function canShowRelaxationItem(item: MeditationRelaxationItem, subtype: string) {
  const isFallbackSubtype = subtype === relaxationSubcategoryKeys[0];
  const matchesSubtype = item.subcategoryKey === subtype || (isFallbackSubtype && !item.subcategoryKey);

  return matchesSubtype && Boolean(item.muxPlaybackId);
}

function matchesRelaxationSubtype(item: MeditationRelaxationItem, subtype: string) {
  const isFallbackSubtype = subtype === relaxationSubcategoryKeys[0];

  return item.subcategoryKey === subtype || (isFallbackSubtype && !item.subcategoryKey);
}

function getRelaxationVideos(items: MeditationRelaxationItem[], subtype: string) {
  return items.filter((item) => canShowRelaxationItem(item, subtype));
}

export default async function MeditationRelaxationSubtypePage({
  params,
}: {
  params: Promise<{ locale: string; subtype: string }>;
}) {
  const { locale, subtype } = await params;
  const subtypeIndex = relaxationSubcategoryKeys.findIndex((key) => key === subtype);

  if (subtypeIndex === -1) notFound();

  const [t, packages, courses] = await Promise.all([
    getTranslations({ locale, namespace: "relaxation" }),
    getTranslations({ locale, namespace: "packages" }),
    getMeditationRelaxationItems(locale),
  ]);
  const categories = t.raw("categories") as Array<{ title: string; description: string }>;
  const category = categories[subtypeIndex];
  const isSelfMassage = subtype === "self-massage-stress-reduction";
  const isBlogAlignedSubtype = subtype === "guided-meditation" || subtype === "relaxation-music";
  const selfMassageArticles = isSelfMassage ? courses.filter((item) => matchesRelaxationSubtype(item, subtype)) : [];
  const videos = isSelfMassage ? [] : getRelaxationVideos(courses, subtype);
  const hasStaticSubtypeContent =
    subtype === "relaxation-music"
    || subtype === "breathing-against-stress"
    || isSelfMassage;
  const musicPlayerCopy = subtype === "relaxation-music"
    ? t.raw("musicPlayer") as {
        title: string;
        play: string;
        pause: string;
        playing: string;
        playAll: string;
        stopAll: string;
        previous: string;
        next: string;
      }
    : null;
  const breathingTechniques = subtype === "breathing-against-stress"
    ? t.raw("breathingTechniques") as {
        title: string;
        intro: string;
        musicNote: string;
        play: string;
        pause: string;
        open: string;
        close: string;
        inhale: string;
        exhale: string;
        hold: string;
        rest: string;
        rhythmLabel: string;
        animationLabel: string;
        musicLabel: string;
        instructionLabel: string;
        musicOnLabel: string;
        musicOffLabel: string;
        breathSoundOnLabel: string;
        breathSoundOffLabel: string;
        education: {
          summary: string;
          title: string;
          intro: string;
          items: Array<{ title: string; basis: string; howItWorks: string }>;
          disclaimerTitle: string;
          disclaimer: string;
        };
        sections: Array<{
          title: string;
          duration: string;
          description: string;
          steps: string[];
          rhythm: string[];
          animation: string;
          music: string[];
          note?: string;
        }>;
      }
    : null;

  return (
    <main className={isSelfMassage ? blogStyles.blogsPage : `${styles.page} ${isBlogAlignedSubtype ? styles.blogAlignedPage : ""}`}>
      <BackButton
        href={`/${locale}/meditation-relaxation`}
        className={isSelfMassage ? blogStyles.backLink : styles.backLink}
      >
        <ArrowLeft size={17} />
        {t("subtype.back")}
      </BackButton>

      {!breathingTechniques ? (
        <section className={isSelfMassage ? blogStyles.hero : styles.subtypeHero}>
          <div className={isSelfMassage ? blogStyles.heroCopy : styles.heroCopy}>
            <p className={isSelfMassage ? blogStyles.eyebrow : styles.eyebrow}>{t("title")}</p>
            <h1 className={isSelfMassage ? blogStyles.title : undefined}>{category.title}</h1>
            <p className={isSelfMassage ? blogStyles.intro : undefined}>{category.description}</p>
          </div>
        </section>
      ) : null}

      {breathingTechniques ? (
        <BreathingTechniques copy={breathingTechniques} />
      ) : null}

      {musicPlayerCopy && videos.length ? (
        <RelaxationMusicPlaylist
          videos={videos.map((video) => ({
            ...video,
            packageLabel: packages(video.packageRequired),
            durationLabel: video.durationMinutes ? t("videos.duration", { count: video.durationMinutes }) : null,
          }))}
          locale={locale}
          copy={musicPlayerCopy}
          playerMessages={{
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
      ) : null}

      {isSelfMassage ? (
        <section className={blogStyles.postGrid} aria-label={category.title}>
          {selfMassageArticles.length ? (
            selfMassageArticles.map((article) => (
              <article key={article.id} className={blogStyles.postCard}>
                <Link
                  href={`/${locale}/meditation-relaxation/${subtype}/${article.slug}`}
                  className={blogStyles.postImageLink}
                >
                  {article.posterImage ? (
                    <Image
                      src={article.posterImage}
                      alt=""
                      fill
                      sizes="(min-width: 1120px) 508px, (min-width: 981px) calc((100vw - 4.2rem) / 2), calc(100vw - 3.7rem)"
                      className={blogStyles.postImage}
                    />
                  ) : (
                    <span className={blogStyles.imageFallback} aria-hidden="true">
                      <HandHeart size={26} />
                    </span>
                  )}
                </Link>

                <div className={blogStyles.postCopy}>
                  <h2 className={blogStyles.postTitle}>
                    <Link href={`/${locale}/meditation-relaxation/${subtype}/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h2>
                  {article.description ? <p className={blogStyles.excerpt}>{article.description}</p> : null}
                  <div className={blogStyles.postMeta}>
                    {article.coach ? (
                      <span>
                        <UserRound size={14} />
                        {article.coach}
                      </span>
                    ) : null}
                    {article.durationMinutes ? (
                      <span>
                        <Clock size={14} />
                        {t("videos.duration", { count: article.durationMinutes })}
                      </span>
                    ) : null}
                    <span>
                      <ShieldCheck size={14} />
                      {packages(article.packageRequired)}
                    </span>
                  </div>
                  <Link
                    href={`/${locale}/meditation-relaxation/${subtype}/${article.slug}`}
                    className={blogStyles.readLink}
                  >
                    {t("selfMassage.readArticle")}
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className={blogStyles.emptyState}>
              <p>{t("selfMassage.emptyText")}</p>
            </div>
          )}
        </section>
      ) : null}

      {(!musicPlayerCopy && videos.length) || !hasStaticSubtypeContent ? (
        <section className={styles.videoList} aria-label={category.title}>
          {videos.length ? (
          videos.map((video) => (
            <Link
              key={video.id}
              href={`/${locale}/meditation-relaxation/${subtype}/${video.slug}`}
              className={styles.videoCourseCard}
            >
              <div className={styles.videoPoster}>
                {video.posterImage ? (
                  <Image src={video.posterImage} alt="" fill sizes="(max-width: 720px) 100vw, 360px" />
                ) : (
                  <PlayCircle size={36} />
                )}
                <span className={styles.videoPlayBadge} aria-hidden="true">
                  <PlayCircle size={18} />
                </span>
              </div>

              <div className={styles.videoCardCopy}>
                <div>
                  <h2>{video.title}</h2>
                  {video.description ? <p>{video.description}</p> : null}
                </div>
                <div className={styles.videoMeta}>
                  {video.durationMinutes ? (
                    <span>
                      <Clock size={13} />
                      {t("videos.duration", { count: video.durationMinutes })}
                    </span>
                  ) : null}
                  <span>
                    <ShieldCheck size={13} />
                    {packages(video.packageRequired)}
                  </span>
                </div>
              </div>
            </Link>
          ))
          ) : (
            <article className={styles.emptyVideoState}>
              <strong>{t("subtype.emptyTitle")}</strong>
              <p>{t("subtype.emptyText")}</p>
            </article>
          )}
        </section>
      ) : null}
    </main>
  );
}
