export type PremiumStatus = "free" | "active" | "past_due" | "canceled";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
  xp: number;
  points: number;
  premiumStatus: PremiumStatus;
  subscriptionStatus: PremiumStatus;
  currentStreak: number;
  longestStreak: number;
  weeklyScore: number;
  monthlyScore: number;
  weeklyLeaderboardRank: number | null;
  monthlyLeaderboardRank: number | null;
  claimedRewardIds: string[];
  roles: string[];
}

export interface CompletionPayload {
  lessonId?: string;
  workoutId?: string;
  completedAt?: string;
}

export interface RewardClaimPayload {
  rewardId: string;
}

export interface StripeCheckoutPayload {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}
