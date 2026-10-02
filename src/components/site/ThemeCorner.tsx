"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { effectiveTheme, setTheme } from "@/components/shell/theme-client";

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** A very quiet light/dark switch, tucked into the top-right corner. */
export function ThemeCorner() {
  const theme = useSyncExternalStore(subscribe, effectiveTheme, () => "light" as const);
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        listeners.forEach((l) => l());
      }}
      aria-label={`Switch to ${next} mode`}
      title={`${next[0].toUpperCase()}${next.slice(1)} mode`}
      className="fixed top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full text-fg-subtle opacity-40 transition-opacity duration-(--duration-base) hover:opacity-100 focus-visible:opacity-100"
    >
      <Icon className="size-3.5" strokeWidth={1.5} />
    </button>
  );
}
