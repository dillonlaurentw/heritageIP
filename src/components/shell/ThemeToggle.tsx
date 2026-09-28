"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { currentTheme, setTheme, type ThemePref } from "./theme-client";

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Three-way switch: light, dark, or follow the system. */
export function ThemeToggle({ className }: { className?: string }) {
  const pref = useSyncExternalStore(subscribe, currentTheme, () => "system" as ThemePref);
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-md bg-bg-inset p-0.5", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={label}
          title={label}
          onClick={() => {
            setTheme(value);
            listeners.forEach((l) => l());
          }}
          className={cn(
            "flex size-6 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:text-fg",
            pref === value && "bg-bg text-fg shadow-popover",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

export function toggleThemeQuick() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  listeners.forEach((l) => l());
}
