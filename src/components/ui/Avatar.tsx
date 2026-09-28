import { cn } from "@/lib/cn";
import { colorFor } from "./Tag";

const sizes = { xs: "size-4 text-[9px]", sm: "size-5 text-[10px]", md: "size-6 text-xs", lg: "size-8 text-sm", xl: "size-12 text-lg" };

/** Initials on a soft tag color. People only; the one round thing in SELF. */
export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?";
  const color = colorFor(name);
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", sizes[size], className)}
      style={{ background: `var(--tag-${color}-bg)`, color: `var(--tag-${color}-fg)` }}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = "sm" }: { names: string[]; max?: number; size?: keyof typeof sizes }) {
  const shown = names.slice(0, max);
  return (
    <span className="inline-flex items-center -space-x-1">
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size={size} className="ring-2 ring-bg" />
      ))}
      {names.length > max && <span className="pl-2 text-xs text-fg-muted">+{names.length - max}</span>}
    </span>
  );
}
