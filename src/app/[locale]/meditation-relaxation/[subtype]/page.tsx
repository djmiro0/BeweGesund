import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getMeditationRelaxationItems, type MeditationRelaxationItem } from "@/lib/contentful";
import BreathingTechniques from "./BreathingTechniques";
import styles from "../Relaxation.module.css";

const relaxationSubcategoryKeys = [
  "guided-meditation",
  "relaxation-music",
  "breathing-against-stress",
  "self-massage-stress-reduction",
] as const;

function getRelaxationVideos(items: MeditationRelaxationItem[], subtype: string) {
  const isFallbackSubtype = subtype === relaxationSubcategoryKeys[0];

  return items.filter((item) => (
    item.muxPlaybackId
    && (item.subcategoryKey === subtype || (isFallbackSubtype && !item.subcategoryKey))
  ));
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
  const videos = getRelaxationVideos(courses, subtype);
  const hasStaticSubtypeContent = subtype === "relaxation-music" || subtype === "breathing-against-stress";
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
    <main className={styles.page}>
      <Link href={`/${locale}/meditation-relaxation`} className={styles.backLink}>
        <ArrowLeft size={17} />
        {t("subtype.back")}
      </Link>

      <section className={styles.subtypeHero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("title")}</p>
          <h1>{category.title}</h1>
          <p>{category.description}</p>
        </div>
        <aside className={styles.subtypePanel}>
          <Sparkles size={20} />
          <strong>{t("subtype.videoCount", { count: videos.length })}</strong>
          <span>{t("subtype.panelText")}</span>
        </aside>
      </section>

      {breathingTechniques ? (
        <BreathingTechniques copy={breathingTechniques} />
      ) : null}

      {videos.length || !hasStaticSubtypeContent ? (
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
