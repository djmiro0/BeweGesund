export type AppLanguage = "english" | "german";
export type AppTheme = "light" | "dark" | "system";
export type UnitSystem = "metric" | "imperial";

export interface AppPreferences {
  language: AppLanguage;
  theme: AppTheme;
  units: UnitSystem;
  videoAutoplay: boolean;
}

export const defaultAppPreferences: AppPreferences = {
  language: "german",
  theme: "system",
  units: "metric",
  videoAutoplay: true,
};

export function normalizeAppPreferences(
  value: Record<string, unknown> | undefined,
  locale: string,
): AppPreferences {
  const language =
    value?.language === "english" || value?.language === "german"
      ? value.language
      : locale === "en"
        ? "english"
        : "german";
  const theme =
    value?.theme === "light" ||
    value?.theme === "dark" ||
    value?.theme === "system"
      ? value.theme
      : defaultAppPreferences.theme;
  const units = value?.units === "imperial" ? "imperial" : "metric";

  return {
    language,
    theme,
    units,
    videoAutoplay:
      typeof value?.videoAutoplay === "boolean"
        ? value.videoAutoplay
        : defaultAppPreferences.videoAutoplay,
  };
}

export function languageToLocale(language: AppLanguage) {
  return language === "english" ? "en" : "de";
}

export function kilogramsToPounds(value: number) {
  return value * 2.2046226218;
}

export function poundsToKilograms(value: number) {
  return value / 2.2046226218;
}

export function centimetersToInches(value: number) {
  return value / 2.54;
}

export function inchesToCentimeters(value: number) {
  return value * 2.54;
}

export function roundMeasurement(value: number) {
  return Math.round(value * 10) / 10;
}
