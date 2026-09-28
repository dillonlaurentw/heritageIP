"use client";

import { Tooltip as T } from "@base-ui/react/tooltip";
import type { ComponentProps, ReactNode } from "react";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <T.Provider delay={400}>{children}</T.Provider>;
}

/** Small dark label on hover. `render` is the trigger element. */
export function Tooltip({
  label,
  shortcut,
  side = "bottom",
  render,
}: {
  label: ReactNode;
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  render: ComponentProps<typeof T.Trigger>["render"];
}) {
  return (
    <T.Root>
      <T.Trigger render={render} />
      <T.Portal>
        <T.Positioner side={side} sideOffset={6} className="z-50">
          <T.Popup className="flex items-center gap-2 rounded-md bg-fg px-2 py-1 text-xs font-medium text-bg transition-opacity duration-(--duration-fast) data-ending-style:opacity-0 data-starting-style:opacity-0">
            {label}
            {shortcut && <span className="opacity-60">{shortcut}</span>}
          </T.Popup>
        </T.Positioner>
      </T.Portal>
    </T.Root>
  );
}
