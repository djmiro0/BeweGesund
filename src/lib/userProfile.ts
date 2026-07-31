import type { MemberPackage } from "@/data";
import { normalizeMemberPackage } from "@/lib/memberPackages";

export type OccupationKey = "sedentary" | "standing" | "physical";
export type AnamnesisStatus = "pending" | "completed" | "review-required";
export type UserGender = "female" | "male";
export type SubscriptionStatus =
  "free" | "trialing" | "active" | "past_due" | "canceled";
const subscriptionStatuses = new Set<SubscriptionStatus>([
  "free",
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

export interface UserProfileData {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  photoURL: string | null;
  age: number | null;
  gender: UserGender | null;
  heightCm: number | null;
  weightKg: number | null;
  occupationKey: OccupationKey | null;
  regionKey: string | null;
  averageStepsPerDay: number | null;
  primaryGoalKey: string | null;
  memberPackage: MemberPackage;
  subscriptionStatus: SubscriptionStatus;
  startedCourseIds: string[];
  completedCourseIds: string[];
  recommendedCourseIds: string[];
  anamnesis: Record<string, unknown> | null;
  anamnesisStatusKey: AnamnesisStatus;
  xp: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
  weeklyScore: number;
  monthlyScore: number;
  weeklyLeaderboardRank: number | null;
  monthlyLeaderboardRank: number | null;
  claimedRewardIds: string[];
  roles: string[];
}

export const emptyUserProfile: UserProfileData = {
  email: null,
  firstName: null,
  lastName: null,
  displayName: null,
  photoURL: null,
  age: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  occupationKey: null,
  regionKey: null,
  averageStepsPerDay: null,
  primaryGoalKey: null,
  memberPackage: "basic",
  subscriptionStatus: "free",
  startedCourseIds: [],
  completedCourseIds: [],
  recommendedCourseIds: [],
  anamnesis: null,
  anamnesisStatusKey: "pending",
  xp: 0,
  points: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyScore: 0,
  monthlyScore: 0,
  weeklyLeaderboardRank: null,
  monthlyLeaderboardRank: null,
  claimedRewardIds: [],
  roles: ["member"],
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  return typeof value === "string" &&
    subscriptionStatuses.has(value as SubscriptionStatus)
    ? (value as SubscriptionStatus)
    : "free";
}

function ageFromLegacyDateOfBirth(value: unknown) {
  if (typeof value !== "string" || !value) return null;

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 1 && age <= 120 ? age : null;
}

export function normalizeUserProfile(
  data: Record<string, unknown> | undefined,
): UserProfileData {
  if (!data) return emptyUserProfile;

  const occupationKey = data.occupationKey;
  const anamnesisStatusKey = data.anamnesisStatusKey;
  return {
    email: optionalString(data.email),
    firstName: optionalString(data.firstName),
    lastName: optionalString(data.lastName),
    displayName: optionalString(data.displayName),
    photoURL: optionalString(data.photoURL),
    age: optionalNumber(data.age) ?? ageFromLegacyDateOfBirth(data.dateOfBirth),
    gender:
      data.gender === "female" || data.gender === "male" ? data.gender : null,
    heightCm: optionalNumber(data.heightCm),
    weightKg: optionalNumber(data.weightKg),
    occupationKey:
      occupationKey === "sedentary" ||
      occupationKey === "standing" ||
      occupationKey === "physical"
        ? occupationKey
        : null,
    regionKey: optionalString(data.regionKey),
    averageStepsPerDay: optionalNumber(data.averageStepsPerDay),
    primaryGoalKey: optionalString(data.primaryGoalKey),
    memberPackage: normalizeMemberPackage(data.memberPackage),
    subscriptionStatus: normalizeSubscriptionStatus(data.subscriptionStatus),
    startedCourseIds: stringArray(data.startedCourseIds),
    completedCourseIds: stringArray(data.completedCourseIds),
    recommendedCourseIds: stringArray(data.recommendedCourseIds),
    anamnesis:
      data.anamnesis &&
      typeof data.anamnesis === "object" &&
      !Array.isArray(data.anamnesis)
        ? (data.anamnesis as Record<string, unknown>)
        : null,
    anamnesisStatusKey:
      anamnesisStatusKey === "completed" ||
      anamnesisStatusKey === "review-required"
        ? anamnesisStatusKey
        : "pending",
    xp: optionalNumber(data.xp) ?? 0,
    points: optionalNumber(data.points) ?? 0,
    currentStreak: optionalNumber(data.currentStreak) ?? 0,
    longestStreak: optionalNumber(data.longestStreak) ?? 0,
    weeklyScore: optionalNumber(data.weeklyScore) ?? 0,
    monthlyScore: optionalNumber(data.monthlyScore) ?? 0,
    weeklyLeaderboardRank: optionalNumber(data.weeklyLeaderboardRank),
    monthlyLeaderboardRank: optionalNumber(data.monthlyLeaderboardRank),
    claimedRewardIds: stringArray(data.claimedRewardIds),
    roles: stringArray(data.roles),
  };
}

export function getProfileFirstName(
  profile: UserProfileData,
  fallback?: string | null,
) {
  return (
    profile.firstName ??
    profile.displayName?.trim().split(/\s+/)[0] ??
    fallback?.trim().split(/\s+/)[0] ??
    ""
  );
}

export function getAuthUserPhotoURL(
  user:
    | {
        photoURL?: string | null;
        providerData?: Array<{ photoURL?: string | null }>;
      }
    | null
    | undefined,
) {
  const authPhotoURL = optionalString(user?.photoURL);
  if (authPhotoURL) return authPhotoURL;

  return (
    user?.providerData
      ?.map((provider) => optionalString(provider.photoURL))
      .find((photoURL): photoURL is string => Boolean(photoURL)) ?? null
  );
}
