import type { Metadata, Route } from "next";
import Link from "next/link";
import { LIMITS } from "@/agents";
import { Tag } from "@/components/ui/Tag";
import { requireAdmin, utcDayStart } from "@/lib/admin";
import { formatTokens, formatUsd, groupCost, runCost } from "@/lib/agent-cost";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { AdminFrame, Table, Td } from "../AdminFrame";

export const metadata: Metadata = { title: "AI usage · Admin" };

const RANGES = [7, 30] as const;

/** What SELF's agents cost, from the AgentRun log: by day, person, agent and company. Estimates from list prices. */
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
      error: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      workspace: { select: { id: true, name: true } },
    },
  });

  const total = groupCost(runs, () => "all")[0] ?? { runs: 0, tokens: 0, cost: 0 };
  const dayKey = (x: Date) => x.toISOString().slice(0, 10);
  const byDay = new Map(groupCost(runs, (r) => dayKey(r.createdAt)).map((r) => [r.key, r]));
  const dayRows = Array.from({ length: days }, (_, i) => byDay.get(dayKey(utcDayStart(i))) ?? { key: dayKey(utcDayStart(i)), runs: 0, tokens: 0, cost: 0 });
  const maxDay = Math.max(...dayRows.map((r) => r.cost), 0.000001);
  const names = new Map(runs.map((r) => [r.user.id, r.user.name]));
  const wsNames = new Map(runs.flatMap((r) => (r.workspace ? [[r.workspace.id, r.workspace.name] as const] : [])));
  const byPerson = groupCost(runs, (r) => r.user.id);
  const byAgent = groupCost(runs, (r) => r.purpose);
  const byWorkspace = groupCost(runs, (r) => r.workspace?.id ?? "none");
  const statusCount = (s: string) => runs.filter((r) => r.status === s).length;
  const problems = runs.filter((r) => r.status === "ERROR" || r.status === "REFUSED" || r.status === "CAPPED").slice(0, 20);

  const today = utcDayStart(0);
  const todayCounts = new Map<string, number>();
  for (const r of runs) if (r.createdAt >= today && r.status !== "DEMO" && r.status !== "CAPPED") todayCounts.set(r.user.id, (todayCounts.get(r.user.id) ?? 0) + 1);
  const nearCap = [...todayCounts].filter(([, n]) => n >= LIMITS.dailyRunsPerUser * 0.75);

  const costTable = (rows: typeof byPerson, label: string, name: (k: string) => string) => (
    <section>
      <h2 className="mb-2 text-sm font-medium text-fg-muted">{label}</h2>
      <Table head={[label.replace("By ", ""), "Runs", "Tokens", "Cost"]}>
        {rows.slice(0, 12).map((r) => (
          <tr key={r.key}>
            <Td className="max-w-56 truncate">{name(r.key)}</Td>
            <Td className="tabular-nums">{r.runs}</Td>
            <Td className="tabular-nums">{formatTokens(r.tokens)}</Td>
            <Td className="tabular-nums">{formatUsd(r.cost)}</Td>
          </tr>
        ))}
      </Table>
    </section>
  );

  return (
    <AdminFrame tab="usage" title="AI usage" description={`Last ${days} days. Estimated from list prices; the Anthropic Console has the real bill. Demo runs cost nothing.`}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <p className="text-lg font-semibold">
          {formatUsd(total.cost)} across {total.runs} runs, {formatTokens(total.tokens)} tokens.
        </p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin/usage?d=${r}` as Route} className={cn("rounded-md px-2.5 py-1 text-sm", r === days ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover")}>
              {r} days
            </Link>
          ))}
        </div>
      </div>
      <p className="mb-8 text-sm text-fg-muted">
        Cap: {LIMITS.dailyRunsPerUser} agent calls per person per day, 3 simulations. OK {statusCount("OK")} · Demo {statusCount("DEMO")} · Capped {statusCount("CAPPED")} · Declined{" "}
        {statusCount("REFUSED")} · Errors {statusCount("ERROR")}
      </p>
      {nearCap.length > 0 && (
        <p className="mb-8 rounded-lg bg-warning-soft px-4 py-3 text-sm">
          Near today&apos;s cap: {nearCap.map(([id, n]) => `${names.get(id)} (${n}/${LIMITS.dailyRunsPerUser})`).join(" · ")}
        </p>
      )}

      <section className="mb-10">
        <h2 className="mb-2 text-sm font-medium text-fg-muted">By day</h2>
        <ol className="flex flex-col gap-0.5">
          {dayRows.map((r) => (
            <li key={r.key} className="grid grid-cols-[5rem_1fr_4.5rem_4.5rem] items-center gap-3 text-xs">
              <span className="text-fg-muted">{formatDate(r.key)}</span>
              <span className="h-2 rounded-sm bg-bg-subtle">
                <span className="block h-full rounded-sm bg-accent" style={{ width: `${(r.cost / maxDay) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{r.runs ? formatUsd(r.cost) : "—"}</span>
              <span className="text-right text-fg-subtle tabular-nums">{r.runs} runs</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-10 lg:grid-cols-3">
        {costTable(byPerson, "By person", (k) => names.get(k) ?? k)}
        {costTable(byAgent, "By agent", (k) => k)}
        {costTable(byWorkspace, "By company", (k) => wsNames.get(k) ?? "No company")}
      </div>

      <section className="mt-10">
        <h2 className="mb-2 text-sm font-medium text-fg-muted">Capped, declined and failed runs</h2>
        {problems.length === 0 ? (
          <p className="text-sm text-fg-subtle">Nothing went wrong.</p>
        ) : (
          <Table head={["When", "Person", "Agent", "Status", "Detail"]}>
            {problems.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{formatDate(r.createdAt)}</Td>
                <Td>{r.user.name}</Td>
                <Td className="font-mono text-xs">{r.purpose}</Td>
                <Td>
                  <Tag color="red">{r.status.toLowerCase()}</Tag>
                </Td>
                <Td className="max-w-md text-fg-muted">
                  {r.error ?? (r.status === "CAPPED" ? "Over the daily cap" : r.status === "REFUSED" ? "Model declined" : "—")}
                  {runCost(r) ? ` · ${formatUsd(runCost(r)!)}` : ""}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </AdminFrame>
  );
}
