import "server-only";
import { cookies } from "next/headers";

export type ThemePref = "light" | "dark" | "system";
export const THEME_COOKIE = "self-theme";

/**
 * The person's saved theme. Light until someone picks otherwise; "system"
 * (follow the OS) only when they chose it.
 */
export async function themePref(): Promise<ThemePref> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" || v === "system" ? v : "light";
}
