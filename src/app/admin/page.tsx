import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { AdminShell, formatDate } from "@/components/admin/AdminShell";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { Label } from "@/components/ui/Label";
import { formatUsd, groupCost } from "@/lib/agent-cost";
import { requireAdmin, utcDayStart } from "@/lib/admin";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin · SELF" };

/** The state of SELF in a few sentences, then what's waiting on the team. */
export default async function AdminOverview() {
  await requireAdmin();
  const weekAgo = utcDayStart(6);

  const [people, onboarded, hubs, discoverable, partners, claimed, pending, accepted, runs, newPeople, conciergeQueue] =
    await Promise.all([
      db.user.count(),
      db.profile.count({ where: { onboardedAt: { not: null } } }),
      db.hub.count(),
      db.hub.count({ where: { discoverable: true } }),
      db.partner.count(),
      db.partner.count({ where: { claimedById: { not: null } } }),
      db.signal.count({ where: { status: "PENDING" } }),
      db.signal.count({ where: { status: "ACCEPTED" } }),
      db.agentRun.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { model: true, status: true, inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true, profile: { select: { roles: true, onboardedAt: true } } },
      }),
      db.signal.findMany({
        where: { kind: "PARTNER_INTRO", status: "PENDING", partner: { claimedById: null } },
        orderBy: { createdAt: "asc" },
        select: { id: true, createdAt: true, partner: { select: { name: true } }, hub: { select: { name: true } } },
      }),
    ]);
  const weekCost = groupCost(runs, () => "all")[0]?.cost ?? 0;
  const trouble = runs.filter((r) => r.status === "ERROR" || r.status === "REFUSED").length;

  return (
    <AdminShell tab="overview" title="Overview">
      <MaskedLines
        className="type-display max-w-[22ch] text-headline"
        lines={[
          `${people} people, ${onboarded} onboarded.`,
          `${hubs} hubs, ${discoverable} open to backers.`,
          `${partners} partners, ${claimed} managed.`,
          `${pending} signals waiting, ${accepted} connected.`,
        ]}
      />
      <p className="measure mt-6 text-lead text-smoke">
        AI this week: {runs.length} runs, about {formatUsd(weekCost)}
        {trouble > 0 && <span className="text-signal"> · {trouble} failed or declined</span>}.{" "}
        <Link href="/admin/usage" className="text-bone underline decoration-line underline-offset-4 hover:decoration-bone">
          See usage
        </Link>
      </p>

      <div className="mt-16 grid grid-cols-1 gap-12 border-t border-line pt-10 md:grid-cols-2">
        <section>
          <Label tone={conciergeQueue.length ? "signal" : "smoke"} live={conciergeQueue.length > 0}>
            Intros waiting on SELF · {String(conciergeQueue.length).padStart(2, "0")}
          </Label>
          <p className="mt-2 text-small text-smoke">
            Requests to partners nobody manages yet. The concierge answers these from Connections.
          </p>
          {conciergeQueue.length === 0 ? (
            <p className="mt-6 text-lead font-semibold">Nothing waiting.</p>
          ) : (
            <ul className="mt-4">
              {conciergeQueue.map((s) => (
                <li key={s.id} className="border-b border-line py-3 last:border-b-0">
                  <p className="text-body font-semibold">
                    {s.hub?.name} → {s.partner?.name}
                  </p>
                  <Label>Asked {formatDate(s.createdAt)}</Label>
                </li>
              ))}
            </ul>
          )}
          {conciergeQueue.length > 0 && (
            <Link href={"/connections" as Route} className="group mt-4 inline-block text-body font-semibold text-signal">
              Answer in Connections <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
          )}
        </section>

        <section>
          <Label>Newest people</Label>
          <ul className="mt-4">
            {newPeople.map((u) => (
              <li key={u.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0">
                <div>
                  <p className="text-body font-semibold">{u.name || u.email}</p>
                  <Label>{u.profile?.roles.join(" · ") || "No roles yet"}</Label>
                </div>
                <Label>{u.profile?.onboardedAt ? formatDate(u.createdAt) : "Onboarding"}</Label>
              </li>
            ))}
          </ul>
          <Link href="/admin/people" className="group mt-4 inline-block text-body font-semibold">
            Everyone <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </section>
      </div>
    </AdminShell>
  );
}
