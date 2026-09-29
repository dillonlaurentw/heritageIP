import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { agentsLive, type AgentChatOutput } from "@/agents";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { AGENT_COPY, isWorkspaceAgent } from "@/lib/workspace-agents";
import { atLeast } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { AgentChat, type ChatMessage } from "./AgentChat";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  return { title: isWorkspaceAgent(key) ? AGENT_COPY[key].name : "Agent" };
}

export default async function AgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ ws: string; key: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const viewer = await requireOnboarded();
  const { ws, key } = await params;
  if (!isWorkspaceAgent(key)) notFound();
  const { workspace, role } = await getWorkspaceAccess(ws, viewer);
  const thread = await db.agentThread.findFirst({
    where: { userId: viewer.user.id, workspaceId: workspace.id, kind: `agent:${key}` },
    orderBy: { createdAt: "desc" },
    select: { messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, text: true, data: true } } },
  });
  const messages: ChatMessage[] = (thread?.messages ?? [])
    .filter((m) => m.role === "USER" || m.role === "AGENT")
    .map((m) => ({ id: m.id, role: m.role as "USER" | "AGENT", text: m.text, data: m.role === "AGENT" ? (m.data as AgentChatOutput | null) : null }));
  const copy = AGENT_COPY[key];

  return (
    <Screen
      crumbs={[
        { label: workspace.name, href: `/w/${workspace.slug}` },
        { label: "Agents", href: `/w/${workspace.slug}/agents` },
        { label: copy.name },
      ]}
      title={copy.name}
      description={copy.line}
      width="narrow"
    >
      <AgentChat
        workspace={{ id: workspace.id, slug: workspace.slug }}
        agent={key}
        initial={messages}
        live={agentsLive()}
        canChat={atLeast(role, "MEMBER")}
        question={(await searchParams).q?.slice(0, 2000)}
      />
    </Screen>
  );
}
