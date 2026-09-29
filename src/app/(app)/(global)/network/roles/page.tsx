import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Screen } from "@/components/shell/Screen";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { optionOf } from "@/lib/db-schema";
import { requireOnboarded } from "@/lib/session";
import { SYSTEM_DBS } from "@/lib/system-dbs";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Roles" };

const commitmentProp = SYSTEM_DBS.roles.schema.properties.find((p) => p.id === "commitment")!;

/** Posted, open roles from every company on SELF. Name, one-liner and the role; nothing else. */
export default async function RolesBoard({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireOnboarded();
  const filter = (await searchParams).c;
  const rows = await db.page.findMany({
    where: { kind: "ROW", archivedAt: null, parent: { systemKey: "roles" }, workspace: { kind: "TEAM" }, props: { path: ["posted"], equals: true } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, props: true, text: true, createdAt: true, workspace: { select: { name: true, oneLiner: true, featured: true } } },
  });
  const open = rows
    .map((r) => ({ ...r, p: (r.props ?? {}) as Record<string, unknown> }))
    .filter((r) => (r.p.state ?? "open") === "open")
    .filter((r) => !filter || r.p.commitment === filter)
    .sort((a, b) => Number(b.workspace.featured) - Number(a.workspace.featured));

  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Roles" }]}
      title="Co-founders & teammates"
      description="Roles builders on SELF are looking for. Say you're interested; if they say yes, you both get each other's details."
      headerActions={
        <LinkButton href="/network/roles/post" variant="primary">
          <Plus className="size-4" /> Post a role
        </LinkButton>
      }
    >
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href="/network/roles" className={`rounded-md px-2.5 py-1 text-sm ${!filter ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}>
          All
        </Link>
        {commitmentProp.options!.map((o) => (
          <Link
            key={o.id}
            href={`/network/roles?c=${o.id}` as Route}
            className={`rounded-md px-2.5 py-1 text-sm ${filter === o.id ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}
          >
            {o.name}
          </Link>
        ))}
      </div>
      {open.length === 0 ? (
        <EmptyState title="No open roles here yet." hint="Be the first: post the role you're looking for." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {open.map((r) => {
            const c = optionOf(commitmentProp, r.p.commitment);
            return (
              <li key={r.id}>
                <Link href={`/network/roles/${r.id}` as Route} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-3 hover:bg-bg-hover">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium">{r.title}</p>
                    <p className="truncate text-sm text-fg-muted">
                      {r.workspace.name}
                      {r.workspace.oneLiner ? ` · ${r.workspace.oneLiner}` : ""}
                    </p>
                  </div>
                  {typeof r.p.skills === "string" && r.p.skills && <span className="hidden max-w-60 truncate text-xs text-fg-subtle md:inline">{r.p.skills}</span>}
                  {c && <Tag color={c.color}>{c.name}</Tag>}
                  <span className="w-16 text-right text-xs text-fg-subtle">{timeAgo(r.createdAt)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
