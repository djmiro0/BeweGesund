"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import {
  Clock,
  Pause,
  Play,
  ShieldCheck,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { MeditationRelaxationItem } from "@/lib/contentful";
import ProtectedMuxPlayer from "../../courses/[slug]/ProtectedMuxPlayer";
import styles from "../Relaxation.module.css";

type RelaxationMusicTrack = MeditationRelaxationItem & {
  packageLabel: string;
  durationLabel: string | null;
};

interface RelaxationMusicPlaylistProps {
  videos: RelaxationMusicTrack[];
  locale: string;
  copy: {
    title: string;
    play: string;
    pause: string;
    playing: string;
    playAll: string;
    stopAll: string;
    previous: string;
    next: string;
  };
  playerMessages: {
    videoPending: string;
    preparingVideo: string;
    signInRequired: string;
    tokenError: string;
    signingMissing: string;
    authError: string;
    subscriptionRequired: string;
    packageRequired: string;
    videoNotFound: string;
    accessCheckFailed: string;
    rateLimited: string;
  };
}

export default function RelaxationMusicPlaylist({
  videos,
  locale,
  copy,
  playerMessages,
}: RelaxationMusicPlaylistProps) {
  const playableVideos = useMemo(
    () => videos.filter((video) => video.muxPlaybackId),
    [videos],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const activeVideo = playableVideos[activeIndex] ?? playableVideos[0];

  const stopSequence = () => setIsSequencePlaying(false);

  const playFrom = (index: number, shouldContinue: boolean) => {
    setActiveIndex(index);
    setIsExpanded(true);
    setIsSequencePlaying(shouldContinue);
  };

  const selectVideo = (index: number) => {
    if (index === activeIndex) {
      setIsSequencePlaying((playing) => !playing);
      return;
    }

    setActiveIndex(index);
  };

  const playNext = useCallback(
    (wrap = false) => {
      setActiveIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= playableVideos.length) {
          if (wrap) return 0;
          setIsSequencePlaying(false);
          return currentIndex;
        }

        return nextIndex;
      });
    },
    [playableVideos.length],
  );

  const playPrevious = () => {
    setActiveIndex((currentIndex) =>
      currentIndex <= 0 ? playableVideos.length - 1 : currentIndex - 1,
    );
  };

  if (!playableVideos.length) return null;

  return isExpanded ? (
    <section
      className={`${styles.musicPlaylist} ${styles.musicPlaylistExpanded}`}
      aria-label={copy.title}
    >
      <div className={styles.musicPlaylistLayout}>
        <div className={styles.musicPlaylistMain}>
          <section
            className={styles.musicPlaylistPlayer}
            aria-label={activeVideo.title}
          >
            <ProtectedMuxPlayer
              key={activeVideo.id}
              playbackId={activeVideo.muxPlaybackId}
              courseSlug={activeVideo.slug}
              contentType="meditationRelaxation"
              locale={locale}
              poster={activeVideo.posterImage}
              title={activeVideo.title}
              autoPlay={isSequencePlaying}
              paused={!isSequencePlaying}
              onEnded={isSequencePlaying ? () => playNext(false) : undefined}
              onPause={() => setIsSequencePlaying(false)}
              onPlay={() => setIsSequencePlaying(true)}
              messages={playerMessages}
            />
          </section>

          <div className={styles.musicPlaylistControls}>
            <button
              type="button"
              onClick={playPrevious}
              data-testid="music-previous"
            >
              <SkipBack size={18} />
              {copy.previous}
            </button>
            <button
              type="button"
              className={`${styles.musicPlaylistPrimaryControl} ${isSequencePlaying ? styles.musicPlaylistStopControl : ""}`}
              data-testid="music-play-all"
              onClick={() =>
                isSequencePlaying ? stopSequence() : playFrom(activeIndex, true)
              }
            >
              {isSequencePlaying ? <Pause size={18} /> : <Play size={18} />}
              {isSequencePlaying ? copy.stopAll : copy.playAll}
            </button>
            <button
              type="button"
              onClick={() => playNext(true)}
              data-testid="music-next"
            >
              <SkipForward size={18} />
              {copy.next}
            </button>
          </div>
        </div>

        <div className={styles.musicPlaylistQueue}>
          {playableVideos.map((video, index) => {
            const isActive = video.id === activeVideo.id;

            return (
              <button
                key={video.id}
                type="button"
                className={`${styles.musicQueueItem} ${isActive ? styles.musicQueueItemActive : ""}`}
                onClick={() => selectVideo(index)}
                data-testid={`music-queue-${index}`}
              >
                <span className={styles.musicQueuePoster}>
                  {video.posterImage ? (
                    <Image src={video.posterImage} alt="" fill sizes="96px" />
                  ) : (
                    <Play size={18} />
                  )}
                </span>
                <span className={styles.musicQueueCopy}>
                  <strong>{video.title}</strong>
                  <span className={styles.videoMeta}>
                    {video.durationLabel ? (
                      <span>
                        <Clock size={13} />
                        {video.durationLabel}
                      </span>
                    ) : null}
                    <span>
                      <ShieldCheck size={13} />
                      {video.packageLabel}
                    </span>
                  </span>
                </span>
                <span
                  className={`${styles.musicQueueAction} ${isActive && isSequencePlaying ? styles.musicQueueActionPlaying : ""}`}
                >
                  {isActive && isSequencePlaying ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                  {isActive && isSequencePlaying ? copy.playing : copy.play}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  ) : (
    <section
      className={`${styles.musicPlaylist} ${styles.musicPlaylistGrid}`}
      aria-label={copy.title}
    >
      <div className={styles.musicGridHeader}>
        <button
          type="button"
          className={styles.primaryAudioButton}
          data-testid="music-play-all"
          onClick={() => playFrom(0, true)}
        >
          <Play size={18} />
          {copy.playAll}
        </button>
      </div>

      <div className={styles.musicVideoGrid}>
        {playableVideos.map((video, index) => (
          <button
            key={video.id}
            type="button"
            className={styles.musicVideoTile}
            onClick={() => playFrom(index, true)}
            data-testid={`music-grid-${index}`}
          >
            <span className={styles.musicVideoTilePoster}>
              {video.posterImage ? (
                <Image
                  src={video.posterImage}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 33vw"
                />
              ) : (
                <Play size={26} />
              )}
              <span className={styles.videoPlayBadge} aria-hidden="true">
                <Play size={18} />
              </span>
            </span>
            <span className={styles.musicVideoTileCopy}>
              <strong>{video.title}</strong>
              <span className={styles.videoMeta}>
                {video.durationLabel ? (
                  <span>
                    <Clock size={13} />
                    {video.durationLabel}
                  </span>
                ) : null}
                <span>
                  <ShieldCheck size={13} />
                  {video.packageLabel}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
