export type PremiumStatus = "free" | "active" | "past_due" | "canceled";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  photoURL: string | null;
  age: number;
  gender: "female" | "male";
  heightCm: number;
  weightKg: number;
  occupationKey: string | null;
  regionKey: string;
  averageStepsPerDay: number | null;
  primaryGoalKey: string | null;
  memberPackage: "basic" | "plus";
  startedCourseIds: string[];
  completedCourseIds: string[];
  recommendedCourseIds: string[];
  anamnesisStatusKey: "pending" | "completed" | "review-required";
  consentAcceptedAt: FirebaseFirestore.FieldValue;
  healthConsentAcceptedAt: FirebaseFirestore.FieldValue;
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
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string | null;
  age?: number;
  gender?: "female" | "male";
  heightCm?: number;
  weightKg?: number;
  occupationKey?: "sedentary" | "standing" | "physical" | null;
  regionKey?: string;
  averageStepsPerDay?: number;
  primaryGoalKey?: string;
  anamnesisStatusKey?: "pending" | "completed" | "review-required";
  memberPackage?: "basic" | "plus";
  consentAccepted?: boolean;
  healthConsentAccepted?: boolean;
}

export interface RewardClaimPayload {
  rewardId: string;
}

export interface StripeCheckoutPayload {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}
