"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

function persistTheme(theme: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore persistence failures (e.g., restricted storage contexts).
  }

  document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

function getStoredTheme(): ThemeMode | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

type ThemeToggleProps = {
  initialTheme?: ThemeMode;
};

export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode | null>(initialTheme ?? null);

  useEffect(() => {
    const appliedTheme = document.documentElement.dataset.theme;
    if (initialTheme) {
      applyTheme(initialTheme);
      persistTheme(initialTheme);
      setCurrentTheme(initialTheme);
      return;
    }

    if (appliedTheme === "light" || appliedTheme === "dark") {
      persistTheme(appliedTheme);
      setCurrentTheme(appliedTheme);
      return;
    }

    const storedTheme = getStoredTheme();
    const resolvedTheme = storedTheme ?? getSystemTheme();
    applyTheme(resolvedTheme);
    persistTheme(resolvedTheme);
    setCurrentTheme(resolvedTheme);
  }, [initialTheme]);

  const handleToggle = () => {
    const appliedTheme = document.documentElement.dataset.theme;
    const fallback = getSystemTheme();
    const resolvedTheme: ThemeMode = appliedTheme === "light" || appliedTheme === "dark" ? appliedTheme : fallback;
    const nextTheme: ThemeMode = resolvedTheme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    persistTheme(nextTheme);
    setCurrentTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggle}
      aria-label="Toggle light and dark mode"
      aria-pressed={currentTheme === "dark"}
      title="Toggle light and dark mode"
    >
      <Sun className="theme-toggle-icon theme-toggle-icon-light" size={18} aria-hidden="true" />
      <Moon className="theme-toggle-icon theme-toggle-icon-dark" size={18} aria-hidden="true" />
    </button>
  );
}
