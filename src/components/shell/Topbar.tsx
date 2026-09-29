"use client";

import { PanelLeftOpen } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { PageIcon } from "@/components/ui/PageIcon";
import { cn } from "@/lib/cn";
import { useShell } from "./ShellContext";

export type Crumb = { label: string; href?: string; icon?: string | null };

/** Breadcrumbs on the left, page actions on the right. Sticky over the content. */
export function Topbar({ crumbs, actions, className }: { crumbs: Crumb[]; actions?: ReactNode; className?: string }) {
  const { sidebarOpen, toggleSidebar } = useShell();
  return (
    <header className={cn("sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 bg-bg/95 px-4 backdrop-blur-sm", className)}>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open sidebar"
        title="Open sidebar (⌘\)"
        className={cn(
          "flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-bg-hover",
          sidebarOpen && "md:hidden",
        )}
      >
        <PanelLeftOpen className="size-4" />
      </button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          const inner = (
            <>
              {c.icon !== undefined && <PageIcon icon={c.icon} />}
              <span className="truncate">{c.label || "Untitled"}</span>
            </>
          );
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <span className="text-fg-subtle">/</span>}
              {c.href && !last ? (
                <Link
                  href={c.href as Route}
                  className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-fg-muted hover:bg-bg-hover hover:text-fg"
                >
                  {inner}
                </Link>
              ) : (
                <span className={cn("flex min-w-0 items-center gap-1.5 px-1.5", last ? "text-fg" : "text-fg-muted")}>{inner}</span>
              )}
            </Fragment>
          );
        })}
      </nav>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
