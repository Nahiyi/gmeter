export type ThemePreference = "system" | "light" | "dark";

const themeStorageKey = "gmeter.theme";

export function getSavedThemePreference(): ThemePreference {
  const value = window.localStorage.getItem(themeStorageKey);
  return value === "system" || value === "light" || value === "dark" ? value : "system";
}

export function saveThemePreference(theme: ThemePreference) {
  window.localStorage.setItem(themeStorageKey, theme);
}

export function resolveThemePreference(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreference(theme: ThemePreference) {
  const resolvedTheme = resolveThemePreference(theme);
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}
