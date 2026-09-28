import type { Metadata } from "next";
import type { Route } from "next";
import { agentsLive } from "@/agents";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile, type TileSpan, type TileTone } from "@/components/mosaic/Tile";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { HUB_AGENT_COPY, HUB_AGENTS } from "@/lib/hub-agents";
import { getHubAccess, hubNumber } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Agents · SELF" };

const SPANS: TileSpan[] = ["half", "half", "square", "square", "square"];
const TONES: TileTone[] = ["bone", "raised", "raised", "raised", "field"];

export default async function HubAgentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const { hub } = await getHubAccess((await params).slug, viewer);
  const threads = await db.agentThread.findMany({
    where: { hubId: hub.id, userId: viewer.user.id, kind: { startsWith: "hub:" } },
    orderBy: { updatedAt: "desc" },
    select: { kind: true, updatedAt: true, _count: { select: { messages: true } } },
  });
  const lastUsed = (key: string) => threads.find((t) => t.kind === `hub:${key}` && t._count.messages > 0);

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href={`/hubs/${hub.slug}`} size="inline" className="text-smoke">
            {hub.name}
          </ArrowLink>
          <Label live={agentsLive()} tone={agentsLive() ? "signal" : "smoke"}>
            {hubNumber(hub.number)} · {agentsLive() ? "Agents live" : "Demo agents · No API key"}
          </Label>
        </div>
        <MaskedLines lines={["Your team of", "agents."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">
          Each one knows {hub.name}: the thesis, the game plan, the team and the go-to-market workspace. Conversations are
          private to you.
        </p>
      </section>
      <div className="px-gutter pb-24">
        <Mosaic>
          {HUB_AGENTS.map((key, i) => {
            const used = lastUsed(key);
            return (
              <Tile
                key={key}
                index={i}
                span={SPANS[i]}
                tone={TONES[i]}
                href={`/hubs/${hub.slug}/agents/${key}` as Route}
                label={used ? `Last used ${used.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : "Standing by"}
                title={HUB_AGENT_COPY[key].name}
                subtitle={HUB_AGENT_COPY[key].line}
              />
            );
          })}
        </Mosaic>
      </div>
    </PageWipe>
  );
}
