"use client";

import { Home, PanelLeftClose, Plus, Settings, Sparkles, Trash2, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PageTree, type TreeHandlers } from "./PageTree";
import { useShell } from "./ShellContext";
import type { ShellWorkspace, TreeNode } from "./types";

export type SidebarProps = {
  user: { name: string; email: string; isAdmin: boolean };
  workspaces: ShellWorkspace[];
  current: ShellWorkspace | null;
  personalSlug: string | null;
  tree: TreeNode[];
  privateTree: TreeNode[];
  inboxCount: number;
  messagesCount: number;
  canEdit: boolean;
  treeHandlers?: TreeHandlers;
  onNewPage?: (where: "workspace" | "private") => void;
  signOut?: () => void;
  footer?: ReactNode;
};

/** Self5: the Notes drawer inside a company: its pages, databases and private notes. Closed until asked for. */
export function Sidebar(p: SidebarProps) {
  const { sidebarOpen, toggleSidebar, closeSidebarOnMobile } = useShell();
  const pathname = usePathname();

  const navLink = (href: string, label: string, icon: ReactNode, extra?: ReactNode) => {
    const active = pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
    return (
      <Link
        href={href as Route}
        onClick={closeSidebarOnMobile}
        className={cn(
          "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-fg-muted hover:bg-bg-hover hover:text-fg",
          active && "bg-surface font-medium text-fg shadow-card hover:bg-surface",
        )}
      >
        <span className="flex size-4 items-center justify-center [&>svg]:size-4 [&>svg]:stroke-[1.6]">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {extra}
      </Link>
    );
  };

  return (
    <>
      {/* Phone: dim the page behind the open sidebar. */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-overlay md:hidden"
        />
      )}
      <aside
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-sidebar shrink-0 flex-col border-r border-border bg-bg transition-transform duration-(--duration-slow) ease-out md:static md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden",
        )}
      >
        <div className="flex h-12 items-center justify-between px-4">
          <span className="text-sm font-medium">Notes</span>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Close notes"
            title="Close notes (⌘\\)"
            className="flex size-7 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-hover hover:text-fg"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        {p.current && (
          <nav aria-label={p.current.name} className="flex flex-col gap-px px-2">
            {navLink(`/w/${p.current.slug}`, p.current.name, <Home />)}
            {navLink(`/w/${p.current.slug}/areas`, "Help by area", <Sparkles />)}
            {navLink(`/w/${p.current.slug}/people`, "People", <Users />)}
            {navLink(`/w/${p.current.slug}/settings`, "Settings", <Settings />)}
          </nav>
        )}

        <div className="scroll-quiet mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
          {p.current && (
            <section>
              <SectionHead
                label={p.current.name}
                onAdd={p.canEdit && p.onNewPage ? () => p.onNewPage?.("workspace") : undefined}
              />
              <PageTree
                nodes={p.tree}
                handlers={p.canEdit ? p.treeHandlers : undefined}
                emptyLabel="No pages yet"
              />
            </section>
          )}
          {p.personalSlug && (
            <section>
              <SectionHead label="Private" onAdd={p.onNewPage ? () => p.onNewPage?.("private") : undefined} />
              <PageTree nodes={p.privateTree} handlers={p.treeHandlers} emptyLabel="Only you can see these" />
            </section>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-2 py-2">
          {p.current && navLink(`/w/${p.current.slug}/trash`, "Trash", <Trash2 />)}
        </div>
      </aside>
    </>
  );
}

function SectionHead({ label, onAdd }: { label: string; onAdd?: () => void }) {
  return (
    <div className="group flex h-6 items-center justify-between px-2">
      <span className="truncate text-xs text-fg-subtle">{label}</span>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`New page in ${label}`}
          className="flex size-5 items-center justify-center rounded-sm text-fg-subtle opacity-0 group-hover:opacity-100 hover:bg-bg-hover hover:text-fg focus:opacity-100"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}
