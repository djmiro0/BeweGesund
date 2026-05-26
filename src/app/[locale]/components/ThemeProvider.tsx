"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const STORAGE_KEY = "sbewegesund-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_EVENT = "sbewegesund-theme-change";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

function readTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const datasetTheme = document.documentElement.dataset.theme;
  if (datasetTheme === "light" || datasetTheme === "dark") {
    return datasetTheme;
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
        window.dispatchEvent(new Event(THEME_EVENT));
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
