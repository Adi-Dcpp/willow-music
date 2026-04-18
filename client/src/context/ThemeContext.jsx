import { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_THEME_ID, getThemeById } from "../lib/themes";

const ThemeContext = createContext(null);

const STORAGE_KEY = "willow-theme";

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved || DEFAULT_THEME_ID;
  });

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  const setTheme = (nextThemeId) => {
    window.localStorage.setItem(STORAGE_KEY, nextThemeId);
    setThemeId(nextThemeId);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
