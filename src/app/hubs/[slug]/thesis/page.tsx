import type { Metadata } from "next";
import { agentsLive, LIMITS } from "@/agents";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { getOwnedHub, hubNumber } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import type { ThesisInput } from "@/lib/thesis-schema";
import { ThesisStudio, type QA, type Round } from "./ThesisStudio";

export const metadata: Metadata = { title: "Thesis · SELF" };
export const maxDuration = 120;

type Data =
  | { type: "questions"; round: number; reflection: string; questions: string[] }
  | { type: "answers"; answers: QA[] }
  | ({ type: "draft" } & ThesisInput);

export default async function ThesisPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const hub = await getOwnedHub((await params).slug, viewer);

  // Rebuild the latest dialogue so a refresh picks up where you left off.
  const thread = await db.agentThread.findFirst({
    where: { hubId: hub.id, kind: "thesis" },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  const answered: QA[] = [];
  const rounds: Round[] = [];
  let pending: Round | null = null;
  let draft: ThesisInput | null = null;
  for (const m of thread?.messages ?? []) {
    const d = m.data as Data | null;
    if (!d) continue;
    if (d.type === "questions") {
      if (pending) rounds.push(pending);
      pending = { round: d.round, reflection: d.reflection, questions: d.questions };
      draft = null;
    } else if (d.type === "answers") {
      answered.push(...d.answers);
      if (pending) rounds.push(pending);
      pending = null;
    } else if (d.type === "draft") {
      const { type: _t, ...rest } = d;
      void _t;
      draft = rest;
      if (pending) rounds.push(pending);
      pending = null;
    }
  }
  // A saved thesis newer than the draft means the draft was already used.
  if (draft && hub.thesis && thread && hub.thesis.updatedAt > thread.messages.at(-1)!.createdAt) draft = null;

  const thesis: ThesisInput | null = hub.thesis
    ? {
        statement: hub.thesis.statement,
        problem: hub.thesis.problem,
        audience: hub.thesis.audience,
        whyNow: hub.thesis.whyNow,
        whyUs: hub.thesis.whyUs,
        contrarian: hub.thesis.contrarian,
        openQuestions: hub.thesis.openQuestions,
      }
    : null;

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <ArrowLink href={`/hubs/${hub.slug}`} size="inline" className="text-smoke">
            {hub.name}
          </ArrowLink>
          <Label>{hubNumber(hub.number)} · Core thesis</Label>
        </div>
        <MaskedLines
          lines={thesis ? ["Sharpen", "the bet."] : ["Make the idea", "hold up."]}
          className="type-display text-display"
        />
        <p className="measure text-lead text-smoke">
          {thesis
            ? "Push on your thesis with SELF, or edit it directly. Every save is kept."
            : "SELF asks the questions a sharp co-founder would. Answer what you can, then it drafts your core thesis for you to edit."}
        </p>
      </section>
      <section className="px-edge pb-32">
        <ThesisStudio
          hub={{ id: hub.id, slug: hub.slug, name: hub.name, rawIdea: hub.rawIdea }}
          thesis={thesis}
          answered={answered}
          pastRounds={rounds}
          pending={pending}
          draft={draft}
          maxRounds={LIMITS.thesisRounds}
          live={agentsLive()}
        />
      </section>
    </PageWipe>
  );
}
