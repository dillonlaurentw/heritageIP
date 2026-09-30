import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Screen } from "@/components/shell/Screen";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "overview", label: "Overview", href: "/admin" },
  { key: "people", label: "People", href: "/admin/people" },
  { key: "applications", label: "Applications", href: "/admin/applications" },
  { key: "reports", label: "Reports", href: "/admin/reports" },
  { key: "workspaces", label: "Workspaces", href: "/admin/workspaces" },
  { key: "partners", label: "Partners", href: "/admin/partners" },
  { key: "signals", label: "Signals", href: "/admin/signals" },
  { key: "usage", label: "AI usage", href: "/admin/usage" },
] as const;

/** The admin area's frame: title, tabs, content. */
export function AdminFrame({ tab, title, description, children }: { tab: (typeof TABS)[number]["key"]; title: string; description?: ReactNode; children: ReactNode }) {
  const current = TABS.find((t) => t.key === tab)!;
  return (
    <Screen crumbs={[{ label: "Admin", href: tab === "overview" ? undefined : "/admin" }, ...(tab === "overview" ? [] : [{ label: current.label }])]} title={title} description={description}>
      <nav className="-mt-4 mb-6 flex flex-wrap gap-1 border-b border-border" aria-label="Admin">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href as Route}
            aria-current={t.key === tab ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-2 pb-2 text-sm", t.key === tab ? "border-fg font-medium" : "border-transparent text-fg-muted hover:text-fg")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </Screen>
  );
}

/** A plain admin table: header row + rows. */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-bg-subtle text-xs text-fg-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;
