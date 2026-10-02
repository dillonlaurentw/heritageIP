import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { themePref } from "@/lib/theme";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
// Headlines: a warm serif, so SELF reads like a conversation, not a document tool.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Self: understanding that carries forward", template: "%s · Self" },
  description: "Give your product and AI agents relevant customer context that improves with every permitted interaction.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pref = await themePref();
  return (
    <html
      lang="en"
      data-theme={pref === "system" ? undefined : pref}
      className={`${geist.variable} ${geistMono.variable} ${serif.variable}`}
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
