import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Reveal } from "@/components/motion/Reveal";
import { ContactLine, PersonBlurb } from "@/components/people/PersonBlurb";
import { SignalButtons } from "@/components/people/SignalButtons";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { getHubAccess, hubNumber } from "@/lib/hubs";
import { STATUS_LABEL } from "@/lib/signal-rules";
import { contactsFor } from "@/lib/signals";
import { requireOnboarded } from "@/lib/session";
import { RoleComposer } from "./RoleComposer";
import { RoleStatusControls } from "./RoleStatus";

export const metadata: Metadata = { title: "Team · SELF" };

const personSelect = {
  id: true,
  name: true,
  profile: { select: { headline: true, strengths: true, buildingToward: true } },
} as const;

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ step?: string; compose?: string }>;
}) {
  const viewer = await requireOnboarded();
  const { hub, isOwner } = await getHubAccess((await params).slug, viewer);
  const { step: stepId, compose } = await searchParams;

  const [owner, members, roles, cofounderSteps] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: hub.ownerId }, select: personSelect }),
    db.hubMember.findMany({ where: { hubId: hub.id }, orderBy: { joinedAt: "asc" }, include: { user: { select: personSelect } } }),
    db.roleOpening.findMany({
      where: { hubId: hub.id, ...(isOwner ? {} : { status: "OPEN" }) },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        planStep: { select: { title: true } },
        // Only the owner sees who signalled interest (the where clause matches nothing otherwise).
        signals: {
          where: isOwner ? {} : { toUserId: viewer.user.id, fromUserId: viewer.user.id },
          orderBy: { createdAt: "desc" },
          include: { fromUser: { select: personSelect } },
        },
      },
    }),
    isOwner ? db.planStep.findMany({ where: { hubId: hub.id, needs: { has: "COFOUNDER" } }, select: { id: true, title: true } }) : [],
  ]);

  const people = [owner, ...members.map((m) => m.user)];
  const contacts = await contactsFor(viewer.user.id, people.map((p) => p.id));
  const fromStep = cofounderSteps.find((s) => s.id === stepId) ?? null;
  const pendingCount = roles.reduce((n, r) => n + r.signals.filter((s) => s.status === "PENDING").length, 0);

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href={`/hubs/${hub.slug}`} size="inline" className="text-smoke">
            {hub.name}
          </ArrowLink>
          <Label>
            {hubNumber(hub.number)} · Team{pendingCount > 0 && ` · ${pendingCount} waiting`}
          </Label>
        </div>
        <MaskedLines lines={["Who's building", "this."]} className="type-display text-display" />
      </section>

      {/* 01 · The team */}
      <section className="border-t border-line px-edge py-12">
        <Label>01 · The team · {String(people.length).padStart(2, "0")}</Label>
        <div className="mt-8 grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {[{ user: owner, role: "Founder" }, ...members.map((m) => ({ user: m.user, role: m.role }))].map(({ user, role }, i) => {
            const you = user.id === viewer.user.id;
            return (
              <Reveal key={user.id} index={i}>
                <div className={`flex min-h-64 flex-col justify-between gap-8 rounded-xs p-5 ${i === 0 ? "bg-bone text-field" : "bg-field-raised"}`}>
                  <Label tone={i === 0 ? "field" : "smoke"}>
                    {role}
                    {you && " · You"}
                  </Label>
                  <div className="flex flex-col gap-5">
                    <PersonBlurb person={{ name: user.name, headline: user.profile?.headline }} compact />
                    {!you && <ContactLine contact={contacts.get(user.id)} tone={i === 0 ? "field" : "bone"} />}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* 02 · Roles */}
      <section className="border-t border-line px-edge py-12 pb-32">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Label>02 · {isOwner ? "Roles you're hiring for" : "Open roles"}</Label>
          <ArrowLink href="/roles" size="inline" className="text-smoke">
            See all open roles on SELF
          </ArrowLink>
        </div>

        {isOwner && (
          <div id="post-role" className="mt-10 scroll-mt-20">
            <RoleComposer hubId={hub.id} steps={cofounderSteps} fromStep={fromStep} startOpen={compose === "1"} />
          </div>
        )}

        <div className="mt-12 flex flex-col">
          {roles.length === 0 && <p className="text-lead text-smoke">No roles posted yet.</p>}
          {roles.map((role) => (
            <article key={role.id} className="grid grid-cols-1 gap-8 border-t border-line py-10 lg:grid-cols-[1fr_1.2fr]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4">
                  <Label tone={role.status === "OPEN" ? "signal" : "smoke"}>{role.status === "OPEN" ? "Open" : role.status === "FILLED" ? "Filled" : "Closed"}</Label>
                  <Label>{role.commitment}</Label>
                  {role.planStep && <Label>Step · {role.planStep.title}</Label>}
                </div>
                <h3 className="type-display text-headline">{role.title}</h3>
                <p className="measure text-body text-smoke">{role.description}</p>
                {role.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {role.skills.map((s) => (
                      <span key={s} className="label rounded-xs border border-line px-2 py-1 text-bone">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {isOwner && <RoleStatusControls roleId={role.id} status={role.status} />}
              </div>

              {isOwner && (
                <div className="flex flex-col gap-gutter">
                  <Label>Interest · {String(role.signals.length).padStart(2, "0")}</Label>
                  {role.signals.length === 0 && <p className="text-body text-smoke">No one yet. Share the role.</p>}
                  {role.signals.map((sig) => (
                    <div key={sig.id} className={`flex flex-col gap-5 rounded-xs p-5 ${sig.status === "PENDING" ? "border border-signal" : "bg-field-raised"}`}>
                      <div className="flex justify-between gap-4">
                        <Label tone={sig.status === "PENDING" ? "signal" : "smoke"} live={sig.status === "PENDING"}>
                          {STATUS_LABEL[sig.status]}
                        </Label>
                        <Label>{sig.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</Label>
                      </div>
                      <PersonBlurb
                        person={{
                          name: sig.fromUser.name,
                          headline: sig.fromUser.profile?.headline,
                          strengths: sig.fromUser.profile?.strengths,
                          buildingToward: sig.fromUser.profile?.buildingToward,
                        }}
                      />
                      <blockquote className="border-l-2 border-line pl-4 text-body">&ldquo;{sig.note}&rdquo;</blockquote>
                      {sig.status === "PENDING" && <SignalButtons signalId={sig.id} mode="respond" acceptLabel="Accept · Add to team" />}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </PageWipe>
  );
}
