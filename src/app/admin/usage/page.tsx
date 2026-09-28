import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { AdminShell, cellClass, formatDate, rowClass, Table } from "@/components/admin/AdminShell";
import { Label } from "@/components/ui/Label";
import { LIMITS } from "@/agents/config";
import { formatTokens, formatUsd, groupCost, runCost } from "@/lib/agent-cost";
import { requireAdmin, utcDayStart } from "@/lib/admin";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "AI usage · Admin · SELF" };

const RANGES = [7, 30] as const;

/**
 * What SELF's agents cost, from the AgentRun log: by day, by person, by
 * agent. Costs are estimates from list prices (`src/lib/agent-cost.ts`).
 */
export default async function AdminUsage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  await requireAdmin();
  const { d } = await searchParams;
  const days = RANGES.find((r) => String(r) === d) ?? 30;
  const since = utcDayStart(days - 1);

  const runs = await db.agentRun.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      purpose: true,
      model: true,
      status: true,
      inputTokens: true,
      outputTokens: true,
      cacheReadTokens: true,
      cacheWriteTokens: true,
      durationMs: true,
      error: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });

  const total = groupCost(runs, () => "all")[0] ?? { runs: 0, tokens: 0, cost: 0 };
  const dayKey = (x: Date) => x.toISOString().slice(0, 10);
  const byDay = new Map(groupCost(runs, (r) => dayKey(r.createdAt)).map((r) => [r.key, r]));
  const dayRows = Array.from({ length: days }, (_, i) => {
    const key = dayKey(utcDayStart(i));
    return byDay.get(key) ?? { key, runs: 0, tokens: 0, cost: 0 };
  });
  const maxDay = Math.max(...dayRows.map((r) => r.cost), 0.000001);
  const names = new Map(runs.map((r) => [r.user.id, r.user.name]));
  const byPerson = groupCost(runs, (r) => r.user.id);
  const byAgent = groupCost(runs, (r) => r.purpose);
  const statusCount = (s: string) => runs.filter((r) => r.status === s).length;
  const problems = runs.filter((r) => r.status === "ERROR" || r.status === "REFUSED" || r.status === "CAPPED").slice(0, 20);

  const today = utcDayStart(0);
  const todayCounts = new Map<string, number>();
  for (const r of runs) {
    if (r.createdAt >= today && r.status !== "DEMO" && r.status !== "CAPPED") {
      todayCounts.set(r.user.id, (todayCounts.get(r.user.id) ?? 0) + 1);
    }
  }
  const nearCap = [...todayCounts].filter(([, n]) => n >= LIMITS.dailyRunsPerUser * 0.75);

  return (
    <AdminShell tab="usage" title="AI usage" count={`Last ${days} days`}>
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-6">
        <p className="type-display max-w-[24ch] text-headline">
          {formatUsd(total.cost)} across {total.runs} runs, {formatTokens(total.tokens)} tokens.
        </p>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/usage?d=${r}` as Route}
              className={`rounded-xs border px-3 py-1.5 text-small font-medium ${r === days ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"}`}
            >
              {r} days
            </Link>
          ))}
        </div>
      </div>
      <p className="measure mb-12 text-body text-smoke">
        Estimated from list prices; the Anthropic Console has the real bill. Demo runs cost nothing. Cap: {LIMITS.dailyRunsPerUser}{" "}
        agent calls per person per day, 3 simulations. · OK {statusCount("OK")} · Demo {statusCount("DEMO")} · Capped{" "}
        {statusCount("CAPPED")} · Declined {statusCount("REFUSED")} · Errors {statusCount("ERROR")}
      </p>

      {nearCap.length > 0 && (
        <section className="mb-12 border-t border-line pt-6">
          <Label tone="signal" live>
            Near today&apos;s cap
          </Label>
          <p className="mt-2 text-body">
            {nearCap.map(([id, n]) => `${names.get(id)} (${n}/${LIMITS.dailyRunsPerUser})`).join(" · ")}
          </p>
        </section>
      )}

      <section className="border-t border-line pt-6">
        <Label>By day · UTC</Label>
        <ol className="mt-4">
          {dayRows.map((r) => (
            <li key={r.key} className="grid grid-cols-[6.5rem_1fr_4.5rem_4rem] items-center gap-4 border-b border-line py-1.5 text-small last:border-b-0">
              <span className="label text-smoke">{formatDate(new Date(`${r.key}T00:00:00Z`))}</span>
              <span className="h-2 bg-line" aria-hidden>
                <span className="block h-full bg-signal" style={{ width: `${(r.cost / maxDay) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{r.runs ? formatUsd(r.cost) : "—"}</span>
              <span className="text-right tabular-nums text-smoke">{r.runs} runs</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <section>
          <Label>By person</Label>
          <div className="mt-2">
            <Table head={["Person", "Runs", "Tokens", "Cost"]}>
              {byPerson.map((r) => (
                <tr key={r.key} className={rowClass}>
                  <td className={cellClass}>{names.get(r.key)}</td>
                  <td className={`${cellClass} tabular-nums`}>{r.runs}</td>
                  <td className={`${cellClass} tabular-nums`}>{formatTokens(r.tokens)}</td>
                  <td className={`${cellClass} tabular-nums`}>{formatUsd(r.cost)}</td>
                </tr>
              ))}
            </Table>
          </div>
        </section>
        <section>
          <Label>By agent</Label>
          <div className="mt-2">
            <Table head={["Agent", "Runs", "Tokens", "Cost"]}>
              {byAgent.map((r) => (
                <tr key={r.key} className={rowClass}>
                  <td className={cellClass}>
                    <span className="label text-bone">{r.key}</span>
                  </td>
                  <td className={`${cellClass} tabular-nums`}>{r.runs}</td>
                  <td className={`${cellClass} tabular-nums`}>{formatTokens(r.tokens)}</td>
                  <td className={`${cellClass} tabular-nums`}>{formatUsd(r.cost)}</td>
                </tr>
              ))}
            </Table>
          </div>
        </section>
      </div>

      <section className="mt-16 border-t border-line pt-6">
        <Label tone={problems.length ? "signal" : "smoke"}>Capped, declined and failed runs</Label>
        {problems.length === 0 ? (
          <p className="mt-4 text-lead font-semibold">Nothing went wrong.</p>
        ) : (
          <div className="mt-2">
            <Table head={["When", "Person", "Agent", "Status", "Detail"]}>
              {problems.map((r) => (
                <tr key={r.id} className={rowClass}>
                  <td className={`${cellClass} whitespace-nowrap`}>{formatDate(r.createdAt)}</td>
                  <td className={cellClass}>{r.user.name}</td>
                  <td className={cellClass}>
                    <span className="label">{r.purpose}</span>
                  </td>
                  <td className={cellClass}>
                    <Label tone="signal">{r.status}</Label>
                  </td>
                  <td className={`${cellClass} max-w-[32rem] text-smoke`}>
                    {r.error ?? (r.status === "CAPPED" ? "Over the daily cap" : r.status === "REFUSED" ? "Model declined" : "—")}
                    {runCost(r) ? ` · ${formatUsd(runCost(r)!)}` : ""}
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
