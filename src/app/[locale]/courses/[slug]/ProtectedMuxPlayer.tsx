"use client";

import { useEffect, useRef, useState } from "react";
import { LockKeyhole, PlayCircle } from "lucide-react";
import {
  usePlaybackReward,
  type ContentRewardTarget,
} from "../../components/ContentReward";
import { useAuth } from "../../components/AuthProvider";
import styles from "./CourseDetail.module.css";

interface ProtectedMuxPlayerProps {
  playbackId: string | null;
  courseSlug: string;
  contentType?: "course" | "meditationRelaxation";
  locale: string;
  poster?: string | null;
  title: string;
  autoPlay?: boolean;
  paused?: boolean;
  reward?: Omit<ContentRewardTarget, "labels" | "points">;
  onEnded?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  messages: {
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

function getPlaybackErrorMessage(
  errorCode: string | undefined,
  messages: ProtectedMuxPlayerProps["messages"],
) {
  if (errorCode === "MUX_SIGNING_NOT_CONFIGURED")
    return messages.signingMissing;
  if (errorCode === "AUTH_REQUIRED" || errorCode === "INVALID_AUTH_TOKEN")
    return messages.authError;
  if (errorCode === "SUBSCRIPTION_REQUIRED")
    return messages.subscriptionRequired;
  if (errorCode === "PACKAGE_REQUIRED") return messages.packageRequired;
  if (
    errorCode === "VIDEO_NOT_FOUND" ||
    errorCode === "PLAYBACK_REQUEST_INVALID"
  )
    return messages.videoNotFound;
  if (errorCode === "ACCESS_CHECK_FAILED") return messages.accessCheckFailed;
  if (errorCode === "RATE_LIMITED") return messages.rateLimited;
  return messages.tokenError;
}

function getPlayerDurationSeconds(player: HTMLElement | null) {
  const duration = (player as (HTMLElement & { duration?: number }) | null)
    ?.duration;
  return typeof duration === "number" &&
    Number.isFinite(duration) &&
    duration > 0
    ? Math.round(duration)
    : undefined;
}

export default function ProtectedMuxPlayer({
  playbackId,
  courseSlug,
  contentType = "course",
  locale,
  poster,
  title,
  autoPlay = false,
  paused = false,
  reward,
  onEnded,
  onPause,
  onPlay,
  messages,
}: ProtectedMuxPlayerProps) {
  const { user, loading, appPreferences } = useAuth();
  const [playbackToken, setPlaybackToken] = useState("");
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaDurationSeconds, setMediaDurationSeconds] = useState<
    number | undefined
  >(reward?.durationSeconds);
  const playerRef = useRef<HTMLElement | null>(null);
  const fallbackStyle = poster
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(11, 18, 32, 0.78), rgba(155, 43, 66, 0.68)), url(${poster})`,
      }
    : undefined;

  useEffect(() => {
    if (!playbackId) return;
    if (document.querySelector('script[data-mux-player="true"]')) return;

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://cdn.jsdelivr.net/npm/@mux/mux-player";
    script.dataset.muxPlayer = "true";
    document.head.appendChild(script);
  }, [playbackId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaybackToken() {
      if (!playbackId || !user) return;

      setError("");
      setPlaybackToken("");

      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/mux/playback-token", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playbackId, courseSlug, contentType, locale }),
        });
        const payload = (await response.json()) as {
          playbackToken?: string;
          error?: string;
          code?: string;
        };

        if (!response.ok || !payload.playbackToken) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Mux playback token request failed.", {
              status: response.status,
              code: payload.code,
              error: payload.error,
            });
          }
          throw new Error(getPlaybackErrorMessage(payload.code, messages));
        }

        if (!cancelled) setPlaybackToken(payload.playbackToken);
      } catch (tokenError) {
        if (!cancelled) {
          setError(
            tokenError instanceof Error
              ? tokenError.message
              : messages.tokenError,
          );
        }
      }
    }

    void loadPlaybackToken();

    return () => {
      cancelled = true;
    };
  }, [contentType, courseSlug, locale, messages, playbackId, user]);

  const rewardTarget = reward
    ? {
        ...reward,
        durationSeconds: reward.durationSeconds ?? mediaDurationSeconds,
      }
    : null;

  usePlaybackReward(
    rewardTarget,
    isPlaying && Boolean(playbackToken) && !paused,
  );

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const syncDuration = () => {
      setMediaDurationSeconds(
        (current) => current ?? getPlayerDurationSeconds(player),
      );
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      syncDuration();
      onPlay?.();
    };

    syncDuration();
    player.addEventListener("durationchange", syncDuration);
    player.addEventListener("loadedmetadata", syncDuration);
    player.addEventListener("ended", handleEnded);
    player.addEventListener("pause", handlePause);
    player.addEventListener("play", handlePlay);

    return () => {
      player.removeEventListener("durationchange", syncDuration);
      player.removeEventListener("loadedmetadata", syncDuration);
      player.removeEventListener("ended", handleEnded);
      player.removeEventListener("pause", handlePause);
      player.removeEventListener("play", handlePlay);
    };
  }, [onEnded, onPause, onPlay, playbackId]);

  useEffect(() => {
    if (!autoPlay || !playbackToken) return;

    const player = playerRef.current as
      (HTMLElement & { play?: () => Promise<void> }) | null;
    void player?.play?.().catch(() => undefined);
  }, [autoPlay, playbackId, playbackToken]);

  useEffect(() => {
    if (!paused) return;

    const player = playerRef.current as
      (HTMLElement & { pause?: () => void }) | null;
    player?.pause?.();
  }, [paused, playbackId]);

  if (!playbackId) {
    return (
      <div className={styles.videoFallback} style={fallbackStyle}>
        <PlayCircle size={30} />
        <span>{messages.videoPending}</span>
      </div>
    );
  }

  if (loading || (user && !playbackToken && !error)) {
    return (
      <div className={styles.videoFallback} style={fallbackStyle}>
        <PlayCircle size={30} />
        <span>{messages.preparingVideo}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.videoFallback} style={fallbackStyle}>
        <LockKeyhole size={30} />
        <span>{messages.signInRequired}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.videoFallback} style={fallbackStyle}>
        <LockKeyhole size={30} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <mux-player
      ref={playerRef}
      playback-id={playbackId}
      playback-token={playbackToken}
      poster={poster ?? undefined}
      metadata-video-title={title}
      stream-type="on-demand"
      auto-play={
        autoPlay ? "true" : appPreferences.videoAutoplay ? "muted" : undefined
      }
      style={{ width: "100%", height: "100%" }}
    />
  );
}
