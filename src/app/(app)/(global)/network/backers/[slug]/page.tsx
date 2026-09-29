import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { backerInterestAction } from "@/app/actions/network";
import { NoteForm } from "@/components/network/NoteForm";
import { NotAnOffer } from "@/components/network/NotAnOffer";
import { Screen } from "@/components/shell/Screen";
import { Progress } from "@/components/ui/Progress";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { canSeeTeaser, contactsFor, isBacker, workspaceOwnerId } from "@/lib/network";
import { requireOnboarded } from "@/lib/session";
import { WORKSPACE_STAGE } from "@/lib/stages";
import { readThesis } from "@/lib/thesis";
import { THESIS_FIELDS } from "@/lib/thesis-doc";

export const metadata: Metadata = { title: "Company" };

/**
 * The teaser a backer sees: name, one-liner, stage, sector, thesis, team
 * names and titles, plan progress counts and the backer ask. Nothing else.
 */
export default async function TeaserPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const ws = await db.workspace.findUnique({
    where: { slug: (await params).slug },
    select: { id: true, kind: true, name: true, oneLiner: true, stage: true, sector: true, backerAsk: true, discoverable: true },
  });
  if (!ws || ws.kind !== "TEAM" || !(await canSeeTeaser(ws, viewer))) notFound();
  const [thesis, members, plan, existing, ownerId] = await Promise.all([
    readThesis(ws.id),
    db.workspaceMember.findMany({ where: { workspaceId: ws.id, role: { not: "GUEST" } }, orderBy: { joinedAt: "asc" }, select: { title: true, user: { select: { name: true } } } }),
    db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: ws.id, systemKey: "gamePlan" } }, select: { id: true } }),
    db.signal.findFirst({ where: { kind: "BACKER_INTEREST", workspaceId: ws.id, fromUserId: viewer.user.id }, orderBy: { createdAt: "desc" }, select: { status: true } }),
    workspaceOwnerId(ws.id),
  ]);
  const steps = plan ? await db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null }, select: { props: true } }) : [];
  const done = steps.filter((s) => (s.props as Record<string, unknown> | null)?.status === "done").length;
  const contact = ownerId ? (await contactsFor(viewer.user.id, [ownerId])).get(ownerId) : undefined;

  return (
    <Screen crumbs={[{ label: "Network", href: "/network" }, { label: "Backers", href: "/network/backers" }, { label: ws.name }]} width="narrow">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ws.name}</h1>
          {ws.oneLiner && <p className="mt-1 text-md text-fg-muted">{ws.oneLiner}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {ws.sector && <Tag>{ws.sector}</Tag>}
            <Tag color="blue">{WORKSPACE_STAGE[ws.stage] ?? ws.stage}</Tag>
            {steps.length > 0 && <Progress done={done} total={steps.length} />}
            {steps.length > 0 && <span className="text-xs text-fg-subtle">game-plan steps done</span>}
          </div>
        </div>
        {thesis && (
          <section className="flex flex-col gap-3">
            <p className="text-lg font-medium leading-snug">{thesis.statement}</p>
            <dl className="flex flex-col gap-3">
              {THESIS_FIELDS.map((f) =>
                thesis[f.key] ? (
                  <div key={f.key}>
                    <dt className="text-xs font-medium text-fg-subtle">{f.label}</dt>
                    <dd className="text-base">{thesis[f.key]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </section>
        )}
        <section>
          <p className="mb-1 text-xs font-medium text-fg-subtle">Team</p>
          <ul className="text-base">
            {members.map((m, i) => (
              <li key={i}>
                {m.user.name}
                {m.title && <span className="text-fg-muted"> · {m.title}</span>}
              </li>
            ))}
          </ul>
        </section>
        {ws.backerAsk && (
          <section className="rounded-lg bg-bg-subtle p-4">
            <p className="text-xs font-medium text-fg-subtle">What they&apos;re looking for in a backer</p>
            <p className="mt-1 text-base">{ws.backerAsk}</p>
          </section>
        )}
        {contact && (
          <section className="rounded-lg border border-border p-4 text-sm">
            <p className="text-xs font-medium text-fg-subtle">You&apos;re connected</p>
            {contact.email && <p className="mt-1">{contact.email}</p>}
            {contact.link && <p className="text-fg-muted">{contact.link}</p>}
          </section>
        )}
        {isBacker(viewer) && (
          <div className="border-t border-border pt-5">
            {existing && existing.status !== "WITHDRAWN" && existing.status !== "DECLINED" ? (
              <p className="text-sm text-fg-muted">{existing.status === "ACCEPTED" ? "They said yes." : "You've signalled interest. You'll hear back in Connections."}</p>
            ) : ws.discoverable ? (
              <NoteForm
                send={backerInterestAction.bind(null, ws.id)}
                cta="Signal interest"
                label="Why this company, in a few sentences"
                placeholder="What you back, and what you could help with. No amounts or terms: SELF is introductions only."
                sentText="Sent. If they say yes, you'll both get each other's details."
              />
            ) : null}
          </div>
        )}
      </div>
      <NotAnOffer />
    </Screen>
  );
}
