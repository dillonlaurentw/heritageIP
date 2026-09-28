"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Multi-select toggles, e.g. focus areas. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  max,
}: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        const full = !on && max !== undefined && value.length >= max;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            disabled={full}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-sm transition-colors duration-(--duration-fast) disabled:opacity-40",
              on ? "border-accent bg-accent-soft text-fg" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {on && <Check className="size-3.5 text-accent-text" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}
