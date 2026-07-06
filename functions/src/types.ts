export type PremiumStatus = "free" | "trialing" | "active" | "past_due" | "canceled";
export type MemberPackage = "basic" | "plus";

export interface CompletionPayload {
  lessonId?: string;
  workoutId?: string;
  completedAt?: string;
}

export interface RewardClaimPayload {
  rewardId: string;
}

export interface StripeCheckoutPayload {
  locale?: "de" | "en";
  memberPackage?: MemberPackage;
}

export interface QuizAnswerPayload {
  questionId?: string;
  optionId?: string;
  answeredAtMs?: number;
}

export interface QuizAttemptPayload {
  quizId?: string;
  answers?: QuizAnswerPayload[];
  durationMs?: number;
  completedAt?: string;
}
