"use client";

import {
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  LogOut,
  MessageCircle,
  NotebookPen,
  Plus,
  Search,
  Shield,
  Sprout,
  Theater,
  User,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/Menu";
import { WorkspaceMark } from "@/components/ui/PageIcon";
import { cn } from "@/lib/cn";
import { useShell } from "./ShellContext";
import { ThemeToggle } from "./ThemeToggle";
import type { ShellWorkspace } from "./types";

export type TopNavProps = {
  user: { name: string; email: string; isAdmin: boolean };
  workspaces: ShellWorkspace[];
  current: ShellWorkspace | null;
  inboxCount: number;
  messagesCount: number;
  signOut?: () => void;
  footer?: ReactNode;
};

/** The four places, in the order a founder's day goes. Everything else lives one tap away. */
export function tabsFor(current: ShellWorkspace | null) {
  return [
    { href: "/home", label: "Today", match: ["/home", "/journal"] },
    { href: "/circle", label: "Circle", match: ["/circle"] },
    { href: "/network", label: "People", match: ["/network", "/opportunities", "/capital"] },
    { href: current ? `/w/${current.slug}` : "/new", label: "Company", match: ["/w/", "/new"] },
  ];
}

function isActive(pathname: string, match: string[]) {
  return match.some((m) => (m.endsWith("/") ? pathname.startsWith(m) : pathname === m || pathname.startsWith(`${m}/`)));
}

const Dot = ({ n }: { n: number }) =>
  n > 0 ? <span aria-label={`${n} new`} className="absolute top-1 right-1 size-2 rounded-full bg-accent ring-2 ring-bg" /> : null;

/**
 * Self5: no sidebar, no page tree up front. A quiet bar with four places
 * (Today, Circle, People, Company); on phones the same four sit at the bottom.
 */
export function TopNav(p: TopNavProps) {
  const pathname = usePathname();
  const { openPalette } = useShell();
  const tabs = tabsFor(p.current);

  return (
    <>
      <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-bg px-4 md:px-6">
        <Link href="/home" className="text-[15px] font-semibold tracking-[0.18em]">
          SELF
        </Link>

        <Menu
          className="w-64"
          trigger={
            <button
              type="button"
              className="ml-2 hidden h-9 max-w-52 items-center gap-2 rounded-full px-3 text-sm text-fg-muted hover:bg-bg-hover hover:text-fg sm:flex"
            >
              {p.current ? <WorkspaceMark name={p.current.name} icon={p.current.icon} /> : <Plus className="size-3.5" />}
              <span className="truncate">{p.current?.name ?? "Start a company"}</span>
              <ChevronDown className="size-3.5 shrink-0 text-fg-subtle" />
            </button>
          }
        >
          <MenuLabel>Your companies</MenuLabel>
          {p.workspaces.map((w) => (
            <MenuItem key={w.slug} icon={<WorkspaceMark name={w.name} icon={w.icon} />} render={<Link href={`/w/${w.slug}` as Route} />}>
              <span className="flex items-center gap-2">
                {w.name}
                {p.current?.slug === w.slug && <Check className="size-3.5 text-accent-text" />}
              </span>
            </MenuItem>
          ))}
          <MenuItem icon={<Plus />} render={<Link href="/new" />}>
            Start something new
          </MenuItem>
        </Menu>

        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 rounded-full bg-bg-inset/70 p-1 md:flex">
          {tabs.map((t) => {
            const active = isActive(pathname, t.match);
            return (
              <Link
                key={t.label}
                href={t.href as Route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[15px] text-fg-muted transition-colors duration-(--duration-fast) hover:text-fg",
                  active && "bg-surface font-medium text-fg shadow-card",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <IconLink label="Search (⌘K)" onClick={() => openPalette()}>
            <Search />
          </IconLink>
          <IconLink label="Messages" href="/messages" active={pathname.startsWith("/messages")}>
            <MessageCircle />
            <Dot n={p.messagesCount} />
          </IconLink>
          <IconLink label="Inbox" href="/inbox" active={pathname.startsWith("/inbox")}>
            <Bell />
            <Dot n={p.inboxCount} />
          </IconLink>
          <Menu
            className="w-60"
            trigger={
              <button type="button" aria-label="You" className="ml-1 rounded-full">
                <Avatar name={p.user.name} size="lg" />
              </button>
            }
          >
            <MenuLabel>{p.user.email}</MenuLabel>
            <MenuItem icon={<Bot />} render={<Link href="/me/self" />}>
              Your Self
            </MenuItem>
            <MenuItem icon={<NotebookPen />} render={<Link href="/journal" />}>
              Your journal
            </MenuItem>
            <MenuItem icon={<CalendarDays />} render={<Link href="/opportunities" />}>
              Opportunities
            </MenuItem>
            <MenuItem icon={<Sprout />} render={<Link href="/capital" />}>
              Capital
            </MenuItem>
            <MenuItem icon={<Theater />} render={<Link href="/simulations" />}>
              Rehearsals
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<User />} render={<Link href="/me" />}>
              Profile and settings
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
            <div className="flex items-center justify-between px-2 py-1.5">
              <ThemeToggle />
            </div>
          </Menu>
        </div>
      </header>

      {/* Phones: the same four places, at the thumb. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        {tabs.map((t) => {
          const active = isActive(pathname, t.match);
          return (
            <Link
              key={t.label}
              href={t.href as Route}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-14 flex-1 items-center justify-center text-sm text-fg-muted", active && "font-medium text-fg")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {p.footer && <div className="fixed right-4 bottom-20 z-40 md:right-auto md:bottom-4 md:left-4">{p.footer}</div>}
    </>
  );
}

function IconLink({
  label,
  href,
  onClick,
  active,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  const cls = cn(
    "relative flex size-9 items-center justify-center rounded-full text-fg-muted hover:bg-bg-hover hover:text-fg [&>svg]:size-[18px] [&>svg]:stroke-[1.6]",
    active && "bg-bg-hover text-fg",
  );
  return href ? (
    <Link href={href as Route} aria-label={label} title={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
