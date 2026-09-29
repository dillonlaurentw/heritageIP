import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { agentsLive } from "@/agents";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { timeAgo } from "@/lib/time";
import { AGENT_COPY, WORKSPACE_AGENTS } from "@/lib/workspace-agents";
import { getWorkspaceAccess } from "@/lib/workspaces";

export const metadata: Metadata = { title: "Agents" };

export default async function AgentsPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace } = await getWorkspaceAccess((await params).ws, viewer);
  const threads = await db.agentThread.findMany({
    where: { userId: viewer.user.id, workspaceId: workspace.id, kind: { startsWith: "agent:" } },
    orderBy: { updatedAt: "desc" },
    select: { kind: true, updatedAt: true, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true } } },
  });
  const lastFor = (key: string) => threads.find((t) => t.kind === `agent:${key}` && t.messages.length);

  return (
    <Screen
      crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` }, { label: "Agents" }]}
      title="Agents"
      description={`Five specialists who know ${workspace.name}: the thesis, the plan, the tasks and the team. They suggest; you decide what goes in.`}
    >
      {!agentsLive() && (
        <p className="mb-6 rounded-lg bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
          Demo mode: no API key is set, so agents give sample answers. Add <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> for real ones.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {WORKSPACE_AGENTS.map((key) => {
          const c = AGENT_COPY[key];
          const last = lastFor(key);
          return (
            <li key={key}>
              <Link
                href={`/w/${workspace.slug}/agents/${key}` as Route}
                className="group flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:border-border-strong hover:bg-bg-hover"
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-accent-soft text-accent-text">
                    <Sparkles className="size-3.5" />
                  </span>
                  <span className="text-md font-semibold">{c.name}</span>
                  <ArrowRight className="ml-auto size-4 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="text-sm text-fg-muted">{c.line}</span>
                {last && (
                  <span className="mt-auto truncate border-t border-border pt-2 text-xs text-fg-subtle">
                    {timeAgo(last.updatedAt)} · {last.messages[0].text.replace(/\s+/g, " ")}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
