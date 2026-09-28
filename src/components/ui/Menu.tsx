"use client";

import { Menu as M } from "@base-ui/react/menu";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Dropdown menu on Base UI. Usage:
 * <Menu trigger={<button>…</button>}><MenuItem onClick=…>Rename</MenuItem></Menu>
 */
export function Menu({
  trigger,
  children,
  align = "start",
  side = "bottom",
  className,
}: {
  trigger: ComponentProps<typeof M.Trigger>["render"];
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <M.Root>
      <M.Trigger render={trigger} />
      <M.Portal>
        <M.Positioner sideOffset={4} align={align} side={side} className="z-50 outline-none">
          <M.Popup className={cn(popupClass, "min-w-48 p-1", className)}>{children}</M.Popup>
        </M.Positioner>
      </M.Portal>
    </M.Root>
  );
}

export const popupClass =
  "origin-[var(--transform-origin)] rounded-lg bg-bg-popover text-fg shadow-popover outline-none transition-[scale,opacity] duration-(--duration-fast) ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";

export const itemClass =
  "flex h-7 w-full cursor-default items-center gap-2 rounded-md px-2 text-sm text-fg outline-none select-none data-highlighted:bg-bg-hover data-disabled:opacity-50";

export function MenuItem({
  icon,
  shortcut,
  danger,
  children,
  className,
  ...rest
}: Omit<ComponentProps<typeof M.Item>, "className"> & { icon?: ReactNode; shortcut?: string; danger?: boolean; className?: string }) {
  return (
    <M.Item className={cn(itemClass, danger && "text-danger", className)} {...rest}>
      {icon && <span className="flex size-4 items-center justify-center text-fg-muted [&>svg]:size-4">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="text-xs text-fg-subtle">{shortcut}</span>}
    </M.Item>
  );
}

export function MenuSeparator() {
  return <M.Separator className="-mx-1 my-1 h-px bg-border" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2 pt-1.5 pb-1 text-xs font-medium text-fg-subtle">{children}</div>;
}
