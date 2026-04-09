"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "system",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  // Sync state from localStorage — but don't touch the DOM class (inline script already set it)
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    const isDark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.background = isDark ? "#1c1c1a" : "#f2f1ec";
    localStorage.setItem("theme", t);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
