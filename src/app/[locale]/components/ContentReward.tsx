"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Gift, Loader2, LockKeyhole, Trophy } from "lucide-react";
import { db, functions } from "../../../../firebase.config";
import { useAuth } from "./AuthProvider";
import styles from "./ContentReward.module.css";

export type ContentRewardType = "blog" | "course" | "relaxation" | "quiz";
export type RewardState =
  "LOCKED" | "AVAILABLE" | "CLAIMED" | "DAILY_LIMIT_REACHED";

interface ContentProgress {
  engagementSeconds: number;
  requiredSeconds: number;
  completed: boolean;
  rewardAvailable: boolean;
  rewardClaimed: boolean;
  dailyLimitReached?: boolean;
}

export interface ContentRewardLabels {
  title: string;
  locked: string;
  available: string;
  claimed: string;
  dailyLimit: string;
  signIn: string;
  xp: string;
  claim: string;
  claiming: string;
}

export interface ContentRewardTarget {
  contentId: string;
  contentType: ContentRewardType;
  durationSeconds?: number;
  points?: number;
  labels: ContentRewardLabels;
}

const defaultProgress: ContentProgress = {
  engagementSeconds: 0,
  requiredSeconds: 0,
  completed: false,
  rewardAvailable: false,
  rewardClaimed: false,
};

function formatRemaining(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getRewardState(progress: ContentProgress): RewardState {
  if (progress.rewardClaimed) return "CLAIMED";
  if (progress.dailyLimitReached) return "DAILY_LIMIT_REACHED";
  if (progress.completed || progress.rewardAvailable) return "AVAILABLE";
  return "LOCKED";
}

function normalizeProgress(
  data: Record<string, unknown> | undefined,
): ContentProgress {
  return {
    engagementSeconds:
      typeof data?.engagementSeconds === "number" ? data.engagementSeconds : 0,
    requiredSeconds:
      typeof data?.requiredSeconds === "number" ? data.requiredSeconds : 0,
    completed: data?.completed === true,
    rewardAvailable: data?.rewardAvailable === true,
    rewardClaimed: data?.rewardClaimed === true,
    dailyLimitReached: data?.dailyLimitReached === true,
  };
}

export function useContentReward(
  target: Omit<ContentRewardTarget, "labels" | "points"> | null,
) {
  const { user } = useAuth();
  const contentId = target?.contentId;
  const contentType = target?.contentType;
  const durationSeconds = target?.durationSeconds;
  const [progress, setProgress] = useState<ContentProgress>(defaultProgress);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const autoClaimedRef = useRef(false);

  useEffect(() => {
    autoClaimedRef.current = false;
    setProgress(defaultProgress);
    setError("");

    if (!user || !contentId) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    return onSnapshot(
      doc(db, "users", user.uid, "contentProgress", contentId),
      (snapshot) => {
        setProgress(
          snapshot.exists()
            ? normalizeProgress(snapshot.data())
            : defaultProgress,
        );
        setLoading(false);
      },
      () => {
        setError("PROGRESS_READ_FAILED");
        setLoading(false);
      },
    );
  }, [contentId, user]);

  const updateEngagement = useCallback(
    async (engagementSeconds: number) => {
      if (!user || !contentId || !contentType || engagementSeconds <= 0) return;

      const updateContentEngagement = httpsCallable<
        {
          contentId: string;
          contentType: ContentRewardType;
          engagementSeconds: number;
          durationSeconds?: number;
        },
        unknown
      >(functions, "updateContentEngagement");

      await updateContentEngagement({
        contentId,
        contentType,
        engagementSeconds,
        durationSeconds,
      });
    },
    [contentId, contentType, durationSeconds, user],
  );

  const claimReward = useCallback(async () => {
    if (!user || !contentId || !contentType || claiming) return;

    setClaiming(true);
    setError("");

    try {
      const claimContentReward = httpsCallable<
        { contentId: string; contentType: ContentRewardType },
        unknown
      >(functions, "claimContentReward");

      await claimContentReward({
        contentId,
        contentType,
      });
    } catch {
      setError("CLAIM_FAILED");
      autoClaimedRef.current = false;
    } finally {
      setClaiming(false);
    }
  }, [claiming, contentId, contentType, user]);

  const rewardState = getRewardState(progress);

  useEffect(() => {
    if (rewardState !== "AVAILABLE" || autoClaimedRef.current) return;

    autoClaimedRef.current = true;
    void claimReward();
  }, [claimReward, rewardState]);

  return {
    progress,
    rewardState,
    loading,
    claiming,
    error,
    updateEngagement,
    claimReward,
    isSignedIn: Boolean(user),
  };
}

export function useActiveReadingReward(
  target: Omit<ContentRewardTarget, "labels" | "points"> | null,
) {
  const reward = useContentReward(target);
  const { isSignedIn, rewardState, updateEngagement } = reward;
  const contentId = target?.contentId;
  const idleSecondsRef = useRef(0);

  useEffect(() => {
    if (!contentId || !isSignedIn || rewardState === "CLAIMED")
      return undefined;

    const resetIdle = () => {
      idleSecondsRef.current = 0;
    };
    const activityEvents = [
      "scroll",
      "click",
      "keydown",
      "touchstart",
      "pointermove",
    ] as const;
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, resetIdle, { passive: true }),
    );

    const intervalId = window.setInterval(() => {
      const isActive =
        document.visibilityState === "visible" &&
        document.hasFocus() &&
        idleSecondsRef.current < 15;
      idleSecondsRef.current += 1;
      if (isActive) void updateEngagement(1).catch(() => undefined);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, resetIdle),
      );
    };
  }, [contentId, isSignedIn, rewardState, updateEngagement]);

  return reward;
}

export function usePlaybackReward(
  target: Omit<ContentRewardTarget, "labels" | "points"> | null,
  isPlaying: boolean,
) {
  const reward = useContentReward(target);
  const { isSignedIn, rewardState, updateEngagement } = reward;
  const contentId = target?.contentId;

  useEffect(() => {
    if (!contentId || !isSignedIn || !isPlaying || rewardState === "CLAIMED")
      return undefined;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void updateEngagement(1).catch(() => undefined);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [contentId, isPlaying, isSignedIn, rewardState, updateEngagement]);

  return reward;
}

export function ContentRewardPanel({
  target,
}: {
  target: ContentRewardTarget;
}) {
  const { user } = useAuth();
  const reward = useContentReward(target);
  const remainingSeconds = Math.max(
    0,
    reward.progress.requiredSeconds - reward.progress.engagementSeconds,
  );
  const percent =
    reward.progress.requiredSeconds > 0
      ? Math.min(
          100,
          Math.round(
            (reward.progress.engagementSeconds /
              reward.progress.requiredSeconds) *
              100,
          ),
        )
      : reward.rewardState === "CLAIMED"
        ? 100
        : 0;
  const message = useMemo(() => {
    if (!user) return target.labels.signIn;
    if (reward.rewardState === "CLAIMED") return target.labels.claimed;
    if (reward.rewardState === "DAILY_LIMIT_REACHED")
      return target.labels.dailyLimit;
    if (reward.rewardState === "AVAILABLE") return target.labels.available;
    return target.labels.locked
      .replace("{time}", formatRemaining(remainingSeconds))
      .replace("{percent}", String(percent));
  }, [percent, remainingSeconds, reward.rewardState, target.labels, user]);
  const Icon =
    reward.rewardState === "CLAIMED"
      ? CheckCircle2
      : reward.rewardState === "AVAILABLE"
        ? Trophy
        : LockKeyhole;

  return (
    <aside className={styles.rewardPanel} aria-live="polite">
      <div className={styles.rewardHeader}>
        <p className={styles.rewardTitle}>{target.labels.title}</p>
        <span className={styles.rewardBadge}>
          <Gift size={14} />
          {target.labels.xp.replace("{points}", String(target.points ?? 0))}
        </span>
      </div>
      <p className={styles.rewardText}>
        <Icon size={15} /> {message}
      </p>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
      {reward.rewardState === "AVAILABLE" ? (
        <button
          type="button"
          className={styles.rewardButton}
          disabled={reward.claiming || reward.loading}
          onClick={() => void reward.claimReward()}
        >
          {reward.claiming ? <Loader2 size={15} /> : <Gift size={15} />}
          {reward.claiming ? target.labels.claiming : target.labels.claim}
        </button>
      ) : null}
      {reward.error ? (
        <p className={styles.rewardText}>{target.labels.available}</p>
      ) : null}
    </aside>
  );
}

export function ActiveReadingReward({
  target,
}: {
  target: ContentRewardTarget;
}) {
  useActiveReadingReward(target);

  return <ContentRewardPanel target={target} />;
}
