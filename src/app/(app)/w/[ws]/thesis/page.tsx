import type { Metadata } from "next";
import type { Route } from "next";
import { agentsLive, LIMITS } from "@/agents";
import { Topbar } from "@/components/shell/Topbar";
import { parseSelfDoc } from "@/lib/self-doc";
import { db } from "@/lib/db";
import { pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { readThesis, thesisPage } from "@/lib/thesis";
import type { ThesisInput } from "@/lib/thesis-doc";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { ThesisStudio, type QA, type Round } from "./ThesisStudio";

export const metadata: Metadata = { title: "Thesis" };

type Data =
  | { type: "questions"; round: number; reflection: string; questions: string[] }
  | { type: "answers"; answers: QA[] }
  | ({ type: "draft" } & ThesisInput);

/** The thesis dialogue: SELF asks, the builder answers, SELF drafts, the builder decides. */
export default async function ThesisStudioPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const [thread, current, page] = await Promise.all([
    db.agentThread.findFirst({
      where: { workspaceId: workspace.id, kind: "thesis" },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    readThesis(workspace.id),
    thesisPage(workspace.id),
  ]);

  // Rebuild the latest dialogue so a refresh picks up where you left off.
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

  return (
    <>
      <Topbar
        crumbs={[
          { label: workspace.name, href: `/w/${workspace.slug}` as Route },
          ...(page ? [{ label: "Thesis", icon: page.icon, href: pageHref(workspace.slug, page.id) }] : []),
          { label: current ? "Sharpen with SELF" : "Write the thesis" },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl px-6 pt-6 pb-24 md:px-12">
      <ThesisStudio
        workspace={{ id: workspace.id, slug: workspace.slug, name: workspace.name, rawIdea: workspace.rawIdea || workspace.oneLiner || "" }}
        thesis={current}
        thesisHref={page ? pageHref(workspace.slug, page.id) : null}
        answered={answered}
        pastRounds={rounds}
        pending={pending}
        draft={draft}
        maxRounds={LIMITS.thesisRounds}
        live={agentsLive()}
        editable={canEdit(role)}
        hasSelf={(parseSelfDoc(viewer.profile.selfDoc)?.lines.length ?? 0) > 0}
      />
      </div>
    </>
  );
}
