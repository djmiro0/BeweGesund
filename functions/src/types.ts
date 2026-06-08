export type PremiumStatus = "free" | "active" | "past_due" | "canceled";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  occupationKey: string | null;
  regionKey: string;
  averageStepsPerDay: number | null;
  primaryGoalKey: string | null;
  memberPackage: "starter" | "rehab-plus" | "all-access";
  startedCourseIds: string[];
  completedCourseIds: string[];
  recommendedCourseIds: string[];
  anamnesisStatusKey: "pending" | "completed" | "review-required";
  consentAcceptedAt: FirebaseFirestore.FieldValue;
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

export interface RegistrationProfilePayload {
  displayName?: string;
  photoURL?: string | null;
  dateOfBirth?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  occupationKey?: "sedentary" | "standing" | "physical" | null;
  regionKey?: string;
  averageStepsPerDay?: number;
  primaryGoalKey?: string;
  anamnesisStatusKey?: "pending" | "completed" | "review-required";
  consentAccepted?: boolean;
}

export interface RewardClaimPayload {
  rewardId: string;
}

export interface StripeCheckoutPayload {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}
