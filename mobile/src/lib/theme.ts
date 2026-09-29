/**
 * SELF's tokens for the app: the same quiet, warm palette as the web
 * (src/design/tokens.css). Orange means "needs you", never decoration.
 */
import { useColorScheme } from "react-native";

const light = {
  isDark: false,
  avatars: ["#1D1D1F", "#3A3A3C", "#6E6E73"],
  avatarFg: "#F6F5F2",
  bg: "#F6F5F2",
  bgSubtle: "#F0EFEB",
  bgInset: "#EBEAE6",
  surface: "#FFFFFF",
  fg: "#1D1D1F",
  fgMuted: "#6E6E73",
  fgSubtle: "#7F7F85",
  border: "#E6E5E1",
  borderStrong: "#D2D2D7",
  primary: "#1D1D1F",
  primaryFg: "#F6F5F2",
  accent: "#E4521B",
  accentText: "#C2440F",
  accentSoft: "rgba(228,82,27,0.1)",
  ringTrack: "#E8E7E3",
  ringLink: "#1D1D1F",
  agent: "#EDECE8",
  danger: "#C9463D",
  shadow: "#1D1D1F",
};

const dark: typeof light = {
  isDark: true,
  avatars: ["#EDECE8", "#C9C8C4", "#A1A1A6"],
  avatarFg: "#1D1D1F",
  bg: "#151514",
  bgSubtle: "#1B1B1A",
  bgInset: "#242423",
  surface: "#1E1E1D",
  fg: "#EDECE8",
  fgMuted: "#A1A1A6",
  fgSubtle: "#85858A",
  border: "#2B2B29",
  borderStrong: "#3C3C3A",
  primary: "#EDECE8",
  primaryFg: "#1D1D1F",
  accent: "#F0612B",
  accentText: "#FF8A5C",
  accentSoft: "rgba(240,97,43,0.15)",
  ringTrack: "#2E2E2C",
  ringLink: "#EDECE8",
  agent: "#2A2A28",
  danger: "#E5675E",
  shadow: "#000000",
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

export const font = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  mono: "GeistMono_400Regular",
};

export const radius = { card: 20, lift: 28, pill: 999, field: 14 };
export const space = { gutter: 20 };
