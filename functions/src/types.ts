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
