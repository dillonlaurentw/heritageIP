import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { themePref } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SELF", template: "%s · SELF" },
  description: "One workspace to build a company: from the first idea to running the business and the team.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pref = await themePref();
  return (
    <html
      lang="en"
      data-theme={pref === "system" ? undefined : pref}
      className={`${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <TooltipProvider>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
