import { cn } from "@/lib/cn";

const sizes = { sm: "size-6 rounded-[7px] text-[9px]", md: "size-8 rounded-[10px] text-[10px]", lg: "size-10 rounded-[12px] text-[11px]" };

/** Agents are soft squares with a two-letter mono mark; people are round (Avatar). */
export function AgentMark({ mark, size = "md", className, label }: { mark: string; size?: keyof typeof sizes; className?: string; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex shrink-0 items-center justify-center bg-agent font-mono text-fg-muted", sizes[size], className)}
    >
      {mark.slice(0, 4)}
    </span>
  );
}
