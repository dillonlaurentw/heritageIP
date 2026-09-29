import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { backerInterestAction } from "@/app/actions/network";
import { NoteForm } from "@/components/network/NoteForm";
import { NotAnOffer } from "@/components/network/NotAnOffer";
import { Ring } from "@/components/ring/Ring";
import { Topbar } from "@/components/shell/Topbar";
import { Card } from "@/components/ui/Card";
import type { RingNode } from "@/lib/ring";
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

  const teamRing: RingNode[] = members.map((m, i) => ({
    id: `t${i}`,
    theme: "COFOUNDERS",
    kind: "person",
    state: "linked",
    name: m.user.name,
    note: m.title ?? "team",
  }));

  return (
    <>
      <Topbar crumbs={[{ label: "Network", href: "/network" }, { label: "Backers", href: "/network/backers" }, { label: ws.name }]} />
      <div className="mx-auto w-full max-w-6xl px-6 pt-4 pb-24 md:px-12">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_21rem]">
          <Card lift className="flex flex-col gap-7 px-8 py-9 md:px-11">
            <div className="flex flex-col gap-2">
              <span className="flex flex-wrap items-center gap-2 text-sm text-fg-subtle">
                {[ws.sector, WORKSPACE_STAGE[ws.stage] ?? ws.stage].filter(Boolean).join(" · ")}
              </span>
              <h1 className="text-title font-medium">{ws.name}</h1>
              {ws.oneLiner && <p className="text-lg text-fg-muted">{ws.oneLiner}</p>}
            </div>
            {thesis && (
              <>
                <p className="text-2xl leading-snug font-medium tracking-tight">{thesis.statement}</p>
                <dl className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
                  {THESIS_FIELDS.map((f) =>
                    thesis[f.key] ? (
                      <div key={f.key} className="flex flex-col gap-1.5">
                        <dt className="text-sm text-fg-subtle">{f.key === "whyUs" ? "Why them" : f.label.replace("we believe", "they believe")}</dt>
                        <dd className="text-md leading-relaxed">{thesis[f.key]}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              </>
            )}
            {ws.backerAsk && (
              <div className="flex flex-col gap-1.5 rounded-lg bg-bg px-5 py-4">
                <span className="text-sm text-fg-subtle">What they&apos;re looking for in a backer</span>
                <span className="text-md leading-relaxed">{ws.backerAsk}</span>
              </div>
            )}
          </Card>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-20">
            <Card className="flex flex-col items-center gap-3 p-5">
              <Ring nodes={teamRing} size={200} labels={false} center={<span className="text-xs text-fg-muted">{ws.name}</span>} />
              <ul className="flex w-full flex-col gap-1 text-sm">
                {members.map((m, i) => (
                  <li key={i}>
                    <span className="font-medium">{m.user.name}</span>
                    {m.title && <span className="text-fg-muted"> · {m.title}</span>}
                  </li>
                ))}
              </ul>
              {steps.length > 0 && (
                <p className="w-full text-sm text-fg-muted">
                  {done} of {steps.length} plan steps done
                </p>
              )}
            </Card>

            {contact && (
              <Card className="flex flex-col gap-1 p-5 text-sm">
                <span className="text-fg-subtle">You&apos;re connected</span>
                {contact.email && <span>{contact.email}</span>}
                {contact.link && <span className="text-fg-muted">{contact.link}</span>}
              </Card>
            )}

            {isBacker(viewer) && (
              <Card className="flex flex-col gap-3 p-5">
                {existing && existing.status !== "WITHDRAWN" && existing.status !== "DECLINED" ? (
                  <p className="text-sm text-fg-muted">{existing.status === "ACCEPTED" ? "They said yes. You can message them." : "You've signalled interest. You'll hear back in Connections."}</p>
                ) : ws.discoverable ? (
                  <NoteForm
                    send={backerInterestAction.bind(null, ws.id)}
                    cta="Signal interest"
                    label="Why this company, in a few sentences"
                    placeholder="What you back, and what you could help with. No amounts or terms: SELF is introductions only."
                    sentText="Sent. If they say yes, you'll both get each other's details."
                  />
                ) : null}
              </Card>
            )}

            <div className="flex flex-col gap-1.5 rounded-xl px-5 py-4 shadow-[inset_0_0_0_1px_var(--border)]">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Investing through a licensed partner</span>
                <span className="rounded-sm bg-agent px-1.5 py-0.5 font-mono text-2xs text-fg-muted">NOT AVAILABLE</span>
              </span>
              <p className="text-sm leading-relaxed text-fg-muted">
                SELF doesn&apos;t take or move investments. If SELF works with a licensed platform in future, investing would happen there,
                under its rules. Today you can signal interest and talk to the founders.
              </p>
            </div>
          </aside>
        </div>
        <NotAnOffer />
      </div>
    </>
  );
}
