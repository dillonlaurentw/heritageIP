import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A page's icon: the emoji or character its author picked, else a quiet
 * document glyph. Icons are content the author chose, not decoration.
 */
export function PageIcon({ icon, size = "sm", className }: { icon?: string | null; size?: "sm" | "md" | "xl"; className?: string }) {
  const box = size === "xl" ? "size-[72px] text-[64px]" : size === "md" ? "size-5 text-[16px]" : "size-4 text-[14px]";
  if (icon) {
    return <span className={cn("inline-flex shrink-0 items-center justify-center leading-none", box, className)}>{icon}</span>;
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center text-fg-subtle", box, className)}>
      <FileText className={size === "xl" ? "size-12" : size === "md" ? "size-4.5" : "size-4"} strokeWidth={1.75} />
    </span>
  );
}

/** A workspace mark: first letter on a soft tile. */
export function WorkspaceMark({ name, icon, size = "sm" }: { name: string; icon?: string | null; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-10 text-lg" : size === "md" ? "size-6 text-sm" : "size-5 text-xs";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-md bg-fg font-semibold text-bg", box)}>
      {icon || name.trim()[0]?.toUpperCase() || "S"}
    </span>
  );
}
