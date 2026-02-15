"use client";

import { useQuery } from "convex/react";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/convex/_generated/api";
import { generateThemePalette } from "@/lib/theme-palette";
import { cn } from "@/lib/utils";

type AppTheme = "default" | "mafia";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (nextTheme: AppTheme) => void;
  accentColor: string | null;
  setAccentColor: (color: string | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<AppTheme>("default");
  
  // Local state for accent color, initialized null
  const [accentColor, setAccentColorState] = useState<string | null>(null);

  // Fetch user preference
  const user = useQuery(api.users.getCurrentUser);
  const userThemeColor = user?.themeColor ?? null;

  // Sync user preference to local state when loaded
  useEffect(() => {
    if (user === undefined) return; // Loading
    setAccentColorState(userThemeColor);
  }, [userThemeColor, user]);

  const setAccentColor = useCallback((color: string | null) => {
    setAccentColorState(color);
  }, []);

  // Apply theme palette to root element
  useEffect(() => {
    const root = document.documentElement;
    if (accentColor) {
      const palette = generateThemePalette(accentColor);
      Object.entries(palette).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    } else {
      // Clear custom properties to revert to CSS defaults
      // We can get the keys from a sample palette or hardcode known keys
      const samplePalette = generateThemePalette("#000000");
      Object.keys(samplePalette).forEach((key) => {
        root.style.removeProperty(key);
      });
    }
  }, [accentColor]);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, accentColor, setAccentColor }),
    [theme, setTheme, accentColor, setAccentColor],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme={theme === "mafia" ? "mafia" : undefined}
        className={cn("min-h-[100dvh] bg-background text-foreground")}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
