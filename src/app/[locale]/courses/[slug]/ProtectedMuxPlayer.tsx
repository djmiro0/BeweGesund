"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, PlayCircle } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import styles from "./CourseDetail.module.css";

interface ProtectedMuxPlayerProps {
  playbackId: string | null;
  courseSlug: string;
  locale: string;
  poster?: string | null;
  title: string;
  messages: {
    videoPending: string;
    preparingVideo: string;
    signInRequired: string;
    tokenError: string;
    signingMissing: string;
    authError: string;
  };
}

function getPlaybackErrorMessage(errorCode: string | undefined, messages: ProtectedMuxPlayerProps["messages"]) {
  if (errorCode === "MUX_SIGNING_NOT_CONFIGURED") return messages.signingMissing;
  if (errorCode === "AUTH_REQUIRED" || errorCode === "INVALID_AUTH_TOKEN") return messages.authError;
  return messages.tokenError;
}

export default function ProtectedMuxPlayer({
  playbackId,
  courseSlug,
  locale,
  poster,
  title,
  messages,
}: ProtectedMuxPlayerProps) {
  const { user, loading } = useAuth();
  const [playbackToken, setPlaybackToken] = useState("");
  const [error, setError] = useState("");
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

      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/mux/playback-token", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playbackId, courseSlug, locale }),
        });
        const payload = (await response.json()) as {
          playbackToken?: string;
          error?: string;
          code?: string;
        };

        if (!response.ok || !payload.playbackToken) {
          throw new Error(getPlaybackErrorMessage(payload.code, messages));
        }

        if (!cancelled) setPlaybackToken(payload.playbackToken);
      } catch (tokenError) {
        if (!cancelled) {
          setError(tokenError instanceof Error ? tokenError.message : messages.tokenError);
        }
      }
    }

    void loadPlaybackToken();

    return () => {
      cancelled = true;
    };
  }, [courseSlug, locale, messages, playbackId, user]);

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
      playback-id={playbackId}
      playback-token={playbackToken}
      poster={poster ?? undefined}
      metadata-video-title={title}
      stream-type="on-demand"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
