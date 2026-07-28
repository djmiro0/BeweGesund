export type PremiumStatus =
  "free" | "trialing" | "active" | "past_due" | "canceled";
export type MemberPackage = "basic" | "plus";

export interface CompletionPayload {
  lessonId?: string;
  workoutId?: string;
  completedAt?: string;
}

export interface RewardClaimPayload {
  rewardId: string;
}

export type ContentRewardType = "blog" | "course" | "relaxation" | "quiz";

export interface ContentEngagementPayload {
  contentId?: string;
  contentType?: ContentRewardType;
  engagementSeconds?: number;
  durationSeconds?: number;
}

export interface ContentRewardClaimPayload {
  contentId?: string;
  contentType?: ContentRewardType;
}

export interface QualifiedVideoViewPayload {
  contentId?: string;
  contentType?: "course" | "relaxation";
  playbackId?: string;
  watchedSeconds?: number;
  durationSeconds?: number;
}

export interface StripeCheckoutPayload {
  locale?: "de" | "en";
  memberPackage?: MemberPackage;
}

export interface QuizAnswerPayload {
  questionId?: string;
  optionId?: string | null;
  answeredAtMs?: number;
}

export interface QuizAttemptPayload {
  quizId?: string;
  answers?: QuizAnswerPayload[];
  durationMs?: number;
  completedAt?: string;
}

export interface CheckQuizAnswerPayload {
  quizId?: string;
  questionId?: string;
  optionId?: string;
  answeredAt?: string;
}

export interface QuizOptionPayload {
  id?: string;
  label?: string;
}

export interface QuizQuestionPayload {
  id?: string;
  prompt?: string;
  options?: QuizOptionPayload[];
  correctOptionId?: string;
}

export interface SaveQuizPayload {
  quizId?: string;
  title?: string;
  description?: string;
  locale?: "de" | "en";
  status?: "draft" | "published";
  availableFrom?: string;
  availableUntil?: string;
  monthlyPeriod?: string;
  timeLimitSeconds?: number;
  allowRetake?: boolean;
  pointsPerCorrect?: number;
  speedBonusMax?: number;
  xpReward?: number;
  questions?: QuizQuestionPayload[];
}
