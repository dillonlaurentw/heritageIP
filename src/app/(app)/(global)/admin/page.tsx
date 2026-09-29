import type { Metadata, Route } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatUsd, groupCost } from "@/lib/agent-cost";
import { requireAdmin, utcDayStart } from "@/lib/admin";
import { timeAgo } from "@/lib/time";
import { AdminFrame } from "./AdminFrame";

export const metadata: Metadata = { title: "Admin" };

function L({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href as Route} className="font-medium text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
      {children}
    </Link>
  );
}

/** The state of SELF in a few sentences, then what just happened. */
export default async function AdminHome() {
  await requireAdmin();
  const week = utcDayStart(6);
  const [people, newPeople, workspaces, openToBackers, partners, unclaimed, pending, runs, recentPeople, recentSignals] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: week } } }),
    db.workspace.count({ where: { kind: "TEAM" } }),
    db.workspace.count({ where: { kind: "TEAM", discoverable: true } }),
    db.partner.count(),
    db.partner.count({ where: { claimedById: null } }),
    db.signal.count({ where: { status: "PENDING" } }),
    db.agentRun.findMany({ where: { createdAt: { gte: week } }, select: { model: true, inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, createdAt: true, profile: { select: { roles: true } } } }),
    db.signal.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, kind: true, status: true, createdAt: true, fromUser: { select: { name: true } }, workspace: { select: { name: true } }, partner: { select: { name: true } } } }),
  ]);
  const cost = groupCost(runs, () => "all")[0]?.cost ?? 0;
  return (
    <AdminFrame tab="overview" title="Admin" description="The SELF control room. Only admins can see this.">
      <div className="flex max-w-3xl flex-col gap-3 text-md leading-relaxed">
        <p>
          <L href="/admin/people">{people} people</L> on SELF, {newPeople} new this week. <L href="/admin/workspaces">{workspaces} companies</L>, {openToBackers} open to
          backers.
        </p>
        <p>
          <L href="/admin/partners">{partners} partner firms</L>; {unclaimed} unclaimed, so their intros come to the concierge. <L href="/admin/signals">{pending} requests</L> waiting
          for an answer.
        </p>
        <p>
          Agents cost about <L href="/admin/usage">{formatUsd(cost)}</L> over the last 7 days ({runs.length} runs).
        </p>
      </div>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-medium text-fg-muted">Newest people</h2>
          <ul className="divide-y divide-border border-y border-border text-sm">
            {recentPeople.map((u) => (
              <li key={u.id} className="flex items-center gap-2 px-1 py-2">
                <span className="flex-1 truncate font-medium">{u.name}</span>
                <span className="text-xs text-fg-muted">{u.profile?.roles.join(", ").toLowerCase() || "no role yet"}</span>
                <span className="w-16 text-right text-xs text-fg-subtle">{timeAgo(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium text-fg-muted">Latest signals</h2>
          <ul className="divide-y divide-border border-y border-border text-sm">
            {recentSignals.map((s) => (
              <li key={s.id} className="flex items-center gap-2 px-1 py-2">
                <span className="flex-1 truncate">
                  <span className="font-medium">{s.fromUser.name}</span> · {s.kind.replace("_", " ").toLowerCase()}
                  {s.partner ? ` → ${s.partner.name}` : s.workspace ? ` · ${s.workspace.name}` : ""}
                </span>
                <span className="text-xs text-fg-muted">{s.status.toLowerCase()}</span>
                <span className="w-16 text-right text-xs text-fg-subtle">{timeAgo(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminFrame>
  );
}
