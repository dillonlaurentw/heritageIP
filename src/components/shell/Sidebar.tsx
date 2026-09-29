"use client";

import {
  Check,
  ChevronsUpDown,
  Home,
  Inbox,
  LogOut,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  User,
  Users,
  Waypoints,
  PanelLeftClose,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Kbd } from "@/components/ui/Kbd";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/Menu";
import { WorkspaceMark } from "@/components/ui/PageIcon";
import { cn } from "@/lib/cn";
import { PageTree, type TreeHandlers } from "./PageTree";
import { useShell } from "./ShellContext";
import { ThemeToggle } from "./ThemeToggle";
import type { ShellWorkspace, TreeNode } from "./types";

export type SidebarProps = {
  user: { name: string; email: string; isAdmin: boolean };
  workspaces: ShellWorkspace[];
  current: ShellWorkspace | null;
  personalSlug: string | null;
  tree: TreeNode[];
  privateTree: TreeNode[];
  inboxCount: number;
  canEdit: boolean;
  treeHandlers?: TreeHandlers;
  onNewPage?: (where: "workspace" | "private") => void;
  signOut?: () => void;
  footer?: ReactNode;
};

/** The left rail: workspace switcher, search, navigation and the page tree. */
export function Sidebar(p: SidebarProps) {
  const { sidebarOpen, toggleSidebar, openPalette, closeSidebarOnMobile } = useShell();
  const pathname = usePathname();

  const navLink = (href: string, label: string, icon: ReactNode, extra?: ReactNode) => {
    const active = pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
    return (
      <Link
        href={href as Route}
        onClick={closeSidebarOnMobile}
        className={cn(
          "flex h-7 items-center gap-2 rounded-md px-2 text-sm text-fg-muted hover:bg-bg-hover hover:text-fg",
          active && "bg-bg-active font-medium text-fg",
        )}
      >
        <span className="flex size-4 items-center justify-center [&>svg]:size-4">{icon}</span>
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
          "fixed inset-y-0 left-0 z-40 flex w-sidebar shrink-0 flex-col border-r border-border bg-bg-subtle transition-transform duration-(--duration-slow) ease-out md:static md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden",
        )}
      >
        <div className="flex items-center gap-1 px-2 pt-2">
          <Menu
            className="w-64"
            trigger={
              <button
                type="button"
                className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left hover:bg-bg-hover"
              >
                <WorkspaceMark name={p.current?.name ?? p.user.name} icon={p.current?.icon} size="md" />
                <span className="flex-1 truncate text-sm font-semibold">{p.current?.name ?? "SELF"}</span>
                <ChevronsUpDown className="size-3.5 text-fg-subtle" />
              </button>
            }
          >
            <MenuLabel>{p.user.email}</MenuLabel>
            {p.workspaces.map((w) => (
              <MenuItem
                key={w.slug}
                icon={<WorkspaceMark name={w.name} icon={w.icon} />}
                render={<Link href={`/w/${w.slug}` as Route} />}
              >
                <span className="flex items-center gap-2">
                  {w.name}
                  {p.current?.slug === w.slug && <Check className="size-3.5 text-accent-text" />}
                </span>
              </MenuItem>
            ))}
            <MenuItem icon={<Plus />} render={<Link href="/new" />}>
              New workspace
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<User />} render={<Link href="/me" />}>
              Your profile
            </MenuItem>
            {p.user.isAdmin && (
              <MenuItem icon={<Shield />} render={<Link href="/admin" />}>
                Admin
              </MenuItem>
            )}
            {p.signOut && (
              <MenuItem icon={<LogOut />} onClick={() => p.signOut?.()}>
                Sign out
              </MenuItem>
            )}
          </Menu>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
            title="Close sidebar (⌘\)"
            className="flex size-7 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-hover hover:text-fg"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <nav aria-label="Main" className="flex flex-col gap-px px-2 pt-2">
          <button
            type="button"
            onClick={() => openPalette()}
            className="flex h-7 items-center gap-2 rounded-md px-2 text-sm text-fg-muted hover:bg-bg-hover hover:text-fg"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Search</span>
            <Kbd>⌘K</Kbd>
          </button>
          {navLink("/home", "Home", <Home />)}
          {navLink(
            "/inbox",
            "Inbox",
            <Inbox />,
            p.inboxCount > 0 ? (
              <span className="rounded-sm bg-accent px-1 text-2xs font-semibold text-accent-fg">{p.inboxCount}</span>
            ) : null,
          )}
          {navLink("/network", "Network", <Waypoints />)}
          {p.current && navLink(`/w/${p.current.slug}/agents`, "Agents", <Sparkles />)}
          {p.current && navLink(`/w/${p.current.slug}/people`, "People", <Users />)}
          {p.current && navLink(`/w/${p.current.slug}/settings`, "Settings", <Settings />)}
        </nav>

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
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
            {p.footer}
          </div>
        </div>
      </aside>
    </>
  );
}

function SectionHead({ label, onAdd }: { label: string; onAdd?: () => void }) {
  return (
    <div className="group flex h-6 items-center justify-between px-2">
      <span className="truncate text-xs font-medium text-fg-subtle">{label}</span>
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
