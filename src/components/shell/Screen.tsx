import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Topbar, type Crumb } from "./Topbar";

/** A non-editor screen (home, settings, network…): top bar, title, content. */
export function Screen({
  crumbs,
  title,
  description,
  actions,
  headerActions,
  children,
  width = "wide",
}: {
  crumbs: Crumb[];
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  width?: "narrow" | "wide" | "full";
}) {
  return (
    <>
      <Topbar crumbs={crumbs} actions={actions} />
      <div
        className={cn(
          "mx-auto w-full px-6 pt-6 pb-24 md:px-12",
          width === "narrow" ? "max-w-3xl" : width === "wide" ? "max-w-5xl" : "max-w-none",
        )}
      >
        {(title || headerActions) && (
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              {title && <h1 className="text-title font-medium">{title}</h1>}
              {description && <p className="mt-2 max-w-2xl text-md text-fg-muted">{description}</p>}
            </div>
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
          </div>
        )}
        {children}
      </div>
    </>
  );
}
