"use client";

import { useState } from "react";
import { Label } from "@/components/ui/Label";

/*
 * Style-guide-only preview of the Signal options. Chosen: hot orange (set in
 * tokens.css). The others stay here so the decision can be revisited by eye.
 * These hex values are the one sanctioned exception to "tokens only".
 */
const options = [
  { id: "orange", name: "Hot orange", hex: "#ff5b1f", note: "Chosen. Opposite the green field, so live states pop." },
  { id: "lime", name: "Electric lime", hex: "#d4ff3a", note: "On-brand, but blends toward the green." },
  { id: "violet", name: "Ultraviolet", hex: "#7b5cff", note: "Weakest for small text on dark." },
] as const;

export function SignalPicker() {
  const [active, setActive] = useState<string>("orange");

  function pick(id: string, hex: string) {
    setActive(id);
    document.documentElement.style.setProperty("--color-signal", hex);
  }

  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => pick(o.id, o.hex)}
          aria-pressed={active === o.id}
          className={`group flex h-48 flex-col justify-between rounded-xs border p-4 text-left transition-colors duration-(--duration-fast) ${
            active === o.id ? "border-bone" : "border-line hover:border-smoke"
          }`}
        >
          <span className="flex items-center justify-between">
            <Label tone={active === o.id ? "bone" : "smoke"}>{active === o.id ? "Previewing" : "Preview"}</Label>
            <span className="size-10" style={{ background: o.hex }} />
          </span>
          <span>
            <span className="type-display block text-title">{o.name}</span>
            <span className="label mt-2 block text-smoke">
              {o.hex} · {o.note}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
