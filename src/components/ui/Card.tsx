import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * White card on the warm paper. `lift` is for the one big sheet on a screen
 * (a thesis, a question); plain cards get a soft, small shadow.
 */
export function Card({ lift, className, ...rest }: ComponentProps<"div"> & { lift?: boolean }) {
  return <div className={cn("rounded-xl bg-surface", lift ? "rounded-2xl shadow-lift" : "shadow-card", className)} {...rest} />;
}

/** A small grey label above a group ("Still unproven", "People who do this"). */
export function Eyebrow({ className, ...rest }: ComponentProps<"span">) {
  return <span className={cn("text-sm text-fg-subtle", className)} {...rest} />;
}

/** "Needs you": the only orange dot in SELF. */
export function NeedsDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full bg-accent", className)} />;
}
