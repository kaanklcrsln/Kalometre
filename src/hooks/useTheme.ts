import { useSyncExternalStore } from "react";
import { getTheme, subscribeTheme, THEMES, toggleTheme } from "../config/theme";

/** Seçili tema, o temanın renkleri (SVG/grafikler için) ve değiştirme fonksiyonu. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getTheme);
  return { theme, colors: THEMES[theme], toggle: toggleTheme };
}
