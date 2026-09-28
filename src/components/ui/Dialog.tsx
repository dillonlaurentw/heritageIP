"use client";

import { Dialog as D } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A centered dialog. Controlled with open/onOpenChange. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  top = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Sit near the top (command palette) instead of centered. */
  top?: boolean;
}) {
  return (
    <D.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <D.Portal>
        <D.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-(--duration-fast) data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <D.Popup
          className={cn(
            "fixed left-1/2 z-50 flex w-[32rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col rounded-lg bg-bg-popover text-fg shadow-dialog outline-none transition-[scale,opacity] duration-(--duration-fast) ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            top ? "top-[12vh]" : "top-1/2 -translate-y-1/2",
            className,
          )}
        >
          {(title || description) && (
            <div className="flex flex-col gap-1 px-5 pt-5">
              {title && <D.Title className="text-lg font-semibold">{title}</D.Title>}
              {description && <D.Description className="text-sm text-fg-muted">{description}</D.Description>}
            </div>
          )}
          {children}
        </D.Popup>
      </D.Portal>
    </D.Root>
  );
}
