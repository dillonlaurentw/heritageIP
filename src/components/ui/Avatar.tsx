import { cn } from "@/lib/cn";

const sizes = {
  xs: "size-4 text-[8px]",
  sm: "size-5 text-[9px]",
  md: "size-6 text-[10px]",
  lg: "size-8 text-xs",
  ring: "size-11 text-sm",
  xl: "size-16 text-lg",
};

/** One of three ink tones, stable per name. */
function toneFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 3) + 1;
}

/** Initials on an ink tone. People are round; agents are soft squares (AgentMark). */
export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?";
  const tone = toneFor(name);
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-medium", sizes[size], className)}
      style={{ background: `var(--avatar-${tone})`, color: "var(--avatar-fg)" }}
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
