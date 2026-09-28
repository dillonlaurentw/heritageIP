import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { agentsLive } from "@/agents";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { HUB_AGENT_COPY, isHubAgent } from "@/lib/hub-agents";
import { getHubAccess, hubNumber } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import type { ChatMessage } from "../actions";
import { AgentChat } from "./AgentChat";

export const metadata: Metadata = { title: "Agent · SELF" };
export const maxDuration = 120;

export default async function HubAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; key: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug, key } = await params;
  if (!isHubAgent(key)) notFound();
  const viewer = await requireOnboarded();
  const { hub, isOwner } = await getHubAccess(slug, viewer);
  const { q } = await searchParams;

  const thread = await db.agentThread.findFirst({
    where: { hubId: hub.id, userId: viewer.user.id, kind: `hub:${key}` },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  const messages: ChatMessage[] = (thread?.messages ?? []).map((m) => {
    const d = (m.data ?? {}) as { suggestedStep?: ChatMessage["suggestedStep"]; addedStepId?: string };
    return { id: m.id, role: m.role, text: m.text, suggestedStep: d.suggestedStep ?? null, addedStepId: d.addedStepId ?? null };
  });
  const copy = HUB_AGENT_COPY[key];

  return (
    <PageWipe>
      <section className="flex flex-col gap-8 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <ArrowLink href={`/hubs/${hub.slug}/agents`} size="inline" className="text-smoke">
            {hub.name} · Agents
          </ArrowLink>
          <Label>{hubNumber(hub.number)} · {copy.role}</Label>
        </div>
        <MaskedLines lines={[copy.name + "."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">{copy.line}</p>
      </section>
      <section className="px-edge pb-32">
        <AgentChat
          hub={{ id: hub.id, slug: hub.slug, name: hub.name }}
          agent={key}
          initial={messages}
          isOwner={isOwner}
          live={agentsLive()}
          firstName={viewer.user.name.split(" ")[0]}
          autoSend={q?.trim() || null}
        />
      </section>
    </PageWipe>
  );
}
