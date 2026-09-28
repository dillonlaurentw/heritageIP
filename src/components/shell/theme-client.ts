"use client";

export type ThemePref = "light" | "dark" | "system";

/** Apply a theme now and remember it for a year (read by the root layout). */
export function setTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  document.cookie = `self-theme=${pref}; path=/; max-age=31536000; samesite=lax`;
}

export function currentTheme(): ThemePref {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

/** The theme actually on screen right now. */
export function effectiveTheme(): "light" | "dark" {
  const pref = currentTheme();
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
