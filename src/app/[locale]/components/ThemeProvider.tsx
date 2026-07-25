"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { AppTheme } from "@/lib/appPreferences";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  preference: AppTheme;
  setThemePreference: (preference: AppTheme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "sbewegesund-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_EVENT = "sbewegesund-theme-change";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

function readThemePreference(): AppTheme {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (
    savedTheme === "light" ||
    savedTheme === "dark" ||
    savedTheme === "system"
  ) {
    return savedTheme;
  }

  return "system";
}

function readTheme(): ThemeMode {
  const preference = readThemePreference();
  if (preference === "light" || preference === "dark") return preference;

  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => callback();

  window.addEventListener(THEME_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  mediaQuery.addEventListener("change", handleChange);

  return () => {
    window.removeEventListener(THEME_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
    mediaQuery.removeEventListener("change", handleChange);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    (): ThemeMode => "light",
  );
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    (): AppTheme => "system",
  );

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setThemePreference = useCallback((nextPreference: AppTheme) => {
    window.localStorage.setItem(STORAGE_KEY, nextPreference);
    const effectiveTheme =
      nextPreference === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : nextPreference;
    applyTheme(effectiveTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      setThemePreference,
      toggleTheme: () => {
        const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
        setThemePreference(nextTheme);
      },
    }),
    [preference, setThemePreference, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
