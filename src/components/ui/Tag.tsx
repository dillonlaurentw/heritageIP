import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const TAG_COLORS = ["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"] as const;
export type TagColor = (typeof TAG_COLORS)[number];

/** Soft colored label for select options, statuses and need tags. */
export function Tag({
  color = "gray",
  children,
  className,
  onRemove,
}: {
  color?: TagColor;
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn("inline-flex h-5 max-w-full items-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap", className)}
      style={{ background: `var(--tag-${color}-bg)`, color: `var(--tag-${color}-fg)` }}
    >
      <span className="truncate">{children}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove" className="-mr-0.5 opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </span>
  );
}

/** Pick a stable tag color from any string. */
export function colorFor(key: string): TagColor {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}
