import type { User } from "firebase/auth";
import type { UserProfileData } from "@/lib/userProfile";
import {
  defaultAppPreferences,
  normalizeAppPreferences,
  type AppPreferences,
} from "@/lib/appPreferences";

export type { AppLanguage, AppTheme, UnitSystem } from "@/lib/appPreferences";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type MainGoal = "lose-weight" | "build-muscle" | "improve-fitness" | "stay-healthy" | "backPain";
export type Gender = "female" | "male";
export type TrainingLocation = "gym" | "home" | "outdoor";
export type Equipment = "no-equipment" | "dumbbells" | "full-gym";
export type DietPreference = "normal" | "vegetarian" | "vegan" | "keto";

export interface ProfileSettingsData {
  profileImageUrl: string;
  fullName: string;
  username: string;
  email: string;
  age: number;
  gender: Gender | "";
  height: number;
  weight: number;
  fitnessLevel: FitnessLevel;
  mainGoal: MainGoal;
}

export interface BodyProgressData {
  currentWeight: number;
  targetWeight: number;
  bodyFatPercentage: number;
  stepGoal: number;
  waterIntakeGoal: number;
  sleepGoal: number;
}

export interface WorkoutPreferencesData {
  preferredWorkoutDays: string[];
  workoutDuration: number;
  trainingLocation: TrainingLocation;
  equipment: Equipment;
  difficultyLevel: FitnessLevel;
  restTimerDuration: number;
}

export interface NutritionSettingsData {
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  dietPreference: DietPreference;
  allergies: string;
}

export interface GamificationData {
  xpPoints: number;
  currentLevel: number;
  currentStreak: number;
  weeklyRank: number | null;
  monthlyRank: number | null;
  badges: string[];
  achievements: string[];
}

export interface NotificationSettingsData {
  workoutReminders: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  challengeUpdates: boolean;
  leaderboardUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface ProgressPhotosData {
  beforeUploadedAt: string;
  afterUploadedAt: string;
  reminderEnabled: boolean;
}

export interface PrivacySettingsData {
  isPublicProfile: boolean;
  showProgressPublicly: boolean;
}

export type AppSettingsData = AppPreferences;

export interface UserSettings {
  profile: ProfileSettingsData;
  bodyProgress: BodyProgressData;
  workoutPreferences: WorkoutPreferencesData;
  nutrition: NutritionSettingsData;
  gamification: GamificationData;
  notifications: NotificationSettingsData;
  progressPhotos: ProgressPhotosData;
  privacy: PrivacySettingsData;
  app: AppSettingsData;
}

export const workoutDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const defaultUserSettings: UserSettings = {
  profile: {
    profileImageUrl: "",
    fullName: "",
    username: "",
    email: "",
    age: 0,
    gender: "",
    height: 0,
    weight: 0,
    fitnessLevel: "beginner",
    mainGoal: "stay-healthy",
  },
  bodyProgress: {
    currentWeight: 0,
    targetWeight: 0,
    bodyFatPercentage: 0,
    stepGoal: 0,
    waterIntakeGoal: 0,
    sleepGoal: 0,
  },
  workoutPreferences: {
    preferredWorkoutDays: [],
    workoutDuration: 30,
    trainingLocation: "home",
    equipment: "no-equipment",
    difficultyLevel: "beginner",
    restTimerDuration: 60,
  },
  nutrition: {
    dailyCalorieGoal: 0,
    proteinGoal: 0,
    carbsGoal: 0,
    fatGoal: 0,
    dietPreference: "normal",
    allergies: "",
  },
  gamification: {
    xpPoints: 0,
    currentLevel: 1,
    currentStreak: 0,
    weeklyRank: null,
    monthlyRank: null,
    badges: [],
    achievements: [],
  },
  notifications: {
    workoutReminders: false,
    mealReminders: false,
    waterReminders: false,
    challengeUpdates: false,
    leaderboardUpdates: false,
    emailNotifications: false,
    pushNotifications: false,
  },
  progressPhotos: {
    beforeUploadedAt: "",
    afterUploadedAt: "",
    reminderEnabled: true,
  },
  privacy: {
    isPublicProfile: false,
    showProgressPublicly: false,
  },
  app: defaultAppPreferences,
};

type StoredSettings = Partial<Omit<UserSettings, "gamification" | "profile">> & {
  profile?: Partial<Pick<ProfileSettingsData, "username" | "fitnessLevel">>;
};

function isMainGoal(value: unknown): value is MainGoal {
  return value === "lose-weight"
    || value === "build-muscle"
    || value === "improve-fitness"
    || value === "stay-healthy"
    || value === "backPain";
}

export function settingsFromFirebase(
  profile: UserProfileData,
  stored: Record<string, unknown> | undefined,
  user: User,
  locale: string,
): UserSettings {
  const preferences = (stored ?? {}) as StoredSettings;
  const settings = structuredClone(defaultUserSettings);

  settings.profile = {
    ...settings.profile,
    ...preferences.profile,
    profileImageUrl: user.photoURL ?? profile.photoURL ?? "",
    fullName: profile.displayName ?? user.displayName ?? "",
    username: preferences.profile?.username ?? user.email?.split("@")[0] ?? "",
    email: user.email ?? profile.email ?? "",
    age: profile.age ?? 0,
    gender: profile.gender ?? "",
    height: profile.heightCm ?? 0,
    weight: profile.weightKg ?? 0,
    mainGoal: isMainGoal(profile.primaryGoalKey) ? profile.primaryGoalKey : "stay-healthy",
  };
  settings.bodyProgress = {
    ...settings.bodyProgress,
    ...preferences.bodyProgress,
    currentWeight: profile.weightKg ?? 0,
    stepGoal: preferences.bodyProgress?.stepGoal ?? profile.averageStepsPerDay ?? 0,
  };
  settings.workoutPreferences = {
    ...settings.workoutPreferences,
    ...preferences.workoutPreferences,
  };
  settings.nutrition = {
    ...settings.nutrition,
    ...preferences.nutrition,
  };
  settings.notifications = {
    ...settings.notifications,
    ...preferences.notifications,
  };
  settings.progressPhotos = {
    ...settings.progressPhotos,
    ...preferences.progressPhotos,
  };
  settings.privacy = {
    ...settings.privacy,
    ...preferences.privacy,
  };
  settings.app = normalizeAppPreferences(
    preferences.app as Record<string, unknown> | undefined,
    locale,
  );
  settings.gamification = {
    xpPoints: profile.xp,
    currentLevel: Math.max(1, Math.floor(profile.xp / 500) + 1),
    currentStreak: profile.currentStreak,
    weeklyRank: profile.weeklyLeaderboardRank,
    monthlyRank: profile.monthlyLeaderboardRank,
    badges: profile.claimedRewardIds,
    achievements: profile.completedCourseIds,
  };

  return settings;
}

export function profileUpdateFromSettings(settings: UserSettings) {
  const [firstName = "", ...lastNameParts] = settings.profile.fullName.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
    displayName: settings.profile.fullName.trim(),
    ...(settings.profile.age > 0 ? { age: settings.profile.age } : {}),
    ...(settings.profile.gender ? { gender: settings.profile.gender } : {}),
    heightCm: settings.profile.height > 0 ? settings.profile.height : null,
    weightKg: settings.profile.weight > 0 ? settings.profile.weight : null,
    primaryGoalKey: settings.profile.mainGoal,
  };
}

export function storedSettingsFromForm(settings: UserSettings): StoredSettings {
  return {
    profile: {
      username: settings.profile.username.trim(),
      fitnessLevel: settings.profile.fitnessLevel,
    },
    bodyProgress: {
      ...settings.bodyProgress,
      currentWeight: settings.profile.weight,
    },
    workoutPreferences: settings.workoutPreferences,
    nutrition: settings.nutrition,
    notifications: settings.notifications,
    progressPhotos: settings.progressPhotos,
    privacy: settings.privacy,
    app: settings.app,
  };
}
