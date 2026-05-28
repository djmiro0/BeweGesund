export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type MainGoal = "lose-weight" | "build-muscle" | "improve-fitness" | "stay-healthy";
export type Gender = "female" | "male" | "non-binary" | "prefer-not-to-say";
export type TrainingLocation = "gym" | "home" | "outdoor";
export type Equipment = "no-equipment" | "dumbbells" | "full-gym";
export type DietPreference = "normal" | "vegetarian" | "vegan" | "keto";
export type AppLanguage = "english" | "german" | "serbian";
export type AppTheme = "light" | "dark" | "system";
export type UnitSystem = "metric" | "imperial";

export interface ProfileSettingsData {
  profileImageUrl: string;
  fullName: string;
  username: string;
  email: string;
  age: number;
  gender: Gender;
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
  weeklyRank: number;
  monthlyRank: number;
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

export interface PrivacySettingsData {
  isPublicProfile: boolean;
  showProgressPublicly: boolean;
}

export interface AppSettingsData {
  language: AppLanguage;
  theme: AppTheme;
  units: UnitSystem;
  videoAutoplay: boolean;
}

export interface UserSettings {
  profile: ProfileSettingsData;
  bodyProgress: BodyProgressData;
  workoutPreferences: WorkoutPreferencesData;
  nutrition: NutritionSettingsData;
  gamification: GamificationData;
  notifications: NotificationSettingsData;
  privacy: PrivacySettingsData;
  app: AppSettingsData;
}

export const workoutDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const defaultUserSettings: UserSettings = {
  profile: {
    profileImageUrl: "",
    fullName: "Sandrin Member",
    username: "sandrin_member",
    email: "member@sbewegesund.com",
    age: 34,
    gender: "prefer-not-to-say",
    height: 176,
    weight: 78,
    fitnessLevel: "intermediate",
    mainGoal: "stay-healthy",
  },
  bodyProgress: {
    currentWeight: 78,
    targetWeight: 74,
    bodyFatPercentage: 22,
    stepGoal: 9000,
    waterIntakeGoal: 2.5,
    sleepGoal: 8,
  },
  workoutPreferences: {
    preferredWorkoutDays: ["Monday", "Wednesday", "Friday"],
    workoutDuration: 45,
    trainingLocation: "home",
    equipment: "dumbbells",
    difficultyLevel: "intermediate",
    restTimerDuration: 60,
  },
  nutrition: {
    dailyCalorieGoal: 2200,
    proteinGoal: 140,
    carbsGoal: 240,
    fatGoal: 70,
    dietPreference: "normal",
    allergies: "None",
  },
  gamification: {
    xpPoints: 4280,
    currentLevel: 12,
    currentStreak: 9,
    weeklyRank: 18,
    monthlyRank: 42,
    badges: ["Consistency", "Hydration", "Live Session"],
    achievements: ["First 10 workouts", "7-day streak", "Profile completed"],
  },
  notifications: {
    workoutReminders: true,
    mealReminders: false,
    waterReminders: true,
    challengeUpdates: true,
    leaderboardUpdates: true,
    emailNotifications: true,
    pushNotifications: false,
  },
  privacy: {
    isPublicProfile: false,
    showProgressPublicly: false,
  },
  app: {
    language: "english",
    theme: "system",
    units: "metric",
    videoAutoplay: true,
  },
};
