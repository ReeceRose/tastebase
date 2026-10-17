"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Theme } from "@/lib/types";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: Theme.SYSTEM,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = Theme.SYSTEM,
  storageKey = "ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored && (Object.values(Theme) as string[]).includes(stored)) {
      setTheme(stored as Theme);
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    const root = window.document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved =
        theme === Theme.SYSTEM
          ? media.matches
            ? Theme.DARK
            : Theme.LIGHT
          : theme;
      root.classList.remove(Theme.LIGHT, Theme.DARK);
      root.classList.add(resolved);
      root.style.colorScheme = resolved;
    };

    apply();
    if (theme !== Theme.SYSTEM) return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, loaded]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
