"use client";

import { Popover as P } from "@base-ui/react/popover";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { popupClass } from "./Menu";

export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  open,
  onOpenChange,
  className,
}: {
  trigger: ComponentProps<typeof P.Trigger>["render"];
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <P.Root open={open} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}>
      <P.Trigger render={trigger} />
      <P.Portal>
        <P.Positioner sideOffset={4} align={align} side={side} className="z-50">
          <P.Popup className={cn(popupClass, "p-2", className)}>{children}</P.Popup>
        </P.Positioner>
      </P.Portal>
    </P.Root>
  );
}
