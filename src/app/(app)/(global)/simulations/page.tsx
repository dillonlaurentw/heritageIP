import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Screen } from "@/components/shell/Screen";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Simulations" };

/** Every simulation your agent took part in (started by you or someone else). */
export default async function SimulationsPage() {
  const viewer = await requireOnboarded();
  const sims = await db.simulation.findMany({
    where: { participants: { some: { userId: viewer.user.id } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      scenarioTitle: true,
      status: true,
      createdAt: true,
      turnCount: true,
      createdBy: { select: { id: true, name: true } },
      workspace: { select: { name: true } },
      participants: { orderBy: { order: "asc" }, select: { user: { select: { name: true } } } },
    },
  });
  return (
    <Screen
      crumbs={[{ label: "Simulations" }]}
      title="Simulations"
      description="Rehearsals between AI stand-ins, built from personas people wrote and approved. Transcripts and conversation starters; never scores."
      headerActions={
        <>
          <LinkButton href="/me/self">Your Self</LinkButton>
          <LinkButton href="/simulations/new" variant="primary">
            <Plus className="size-4" /> New simulation
          </LinkButton>
        </>
      }
    >
      {sims.length === 0 ? (
        <EmptyState title="No simulations yet." hint="Run one with a teammate or candidate to rehearse a hard conversation." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {sims.map((s) => (
            <li key={s.id}>
              <Link href={`/simulations/${s.id}` as Route} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-3 hover:bg-bg-hover">
                <Tag color="purple">SIMULATION</Tag>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium">{s.scenarioTitle}</span>
                  <span className="block truncate text-xs text-fg-muted">
                    {s.createdBy.id === viewer.user.id ? "Started by you" : `Started by ${s.createdBy.name}`}
                    {s.workspace && ` · ${s.workspace.name}`} · with {s.participants.map((p) => p.user.name.split(" ")[0]).join(", ")}
                  </span>
                </span>
                <Tag color={s.status === "RUNNING" ? "yellow" : s.status === "DONE" ? "green" : "gray"}>
                  {s.status === "DONE" ? "Finished" : s.status === "RUNNING" ? "Running" : "Stopped"}
                </Tag>
                <span className="w-16 text-right text-xs text-fg-subtle">{formatDate(s.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
