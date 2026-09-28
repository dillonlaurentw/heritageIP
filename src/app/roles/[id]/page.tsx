import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { HubCover } from "@/components/mosaic/HubCover";
import { ContactLine } from "@/components/people/PersonBlurb";
import { SignalButtons } from "@/components/people/SignalButtons";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { hubNumber } from "@/lib/hubs";
import { contactsFor } from "@/lib/signals";
import { requireOnboarded } from "@/lib/session";
import { InterestForm } from "./InterestForm";

export const metadata: Metadata = { title: "Role · SELF" };

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireOnboarded();
  const role = await db.roleOpening.findUnique({
    where: { id: (await params).id },
    include: {
      hub: {
        select: {
          id: true, slug: true, name: true, number: true, oneLiner: true, ownerId: true,
          coverLayout: true, coverTone: true, coverImageUrl: true,
          thesis: { select: { statement: true } },
          owner: { select: { id: true, name: true, profile: { select: { headline: true } } } },
        },
      },
    },
  });
  // Closed roles are only visible to people who already signalled.
  const mine = role
    ? await db.signal.findFirst({ where: { roleOpeningId: role.id, fromUserId: viewer.user.id }, orderBy: { createdAt: "desc" } })
    : null;
  if (!role || (role.status !== "OPEN" && !mine && role.hub.ownerId !== viewer.user.id)) notFound();

  const isOwner = role.hub.ownerId === viewer.user.id;
  const owner = role.hub.owner;
  const contact = (await contactsFor(viewer.user.id, [owner.id])).get(owner.id);
  const isBuilder = viewer.profile.roles.includes("BUILDER");

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href="/roles" size="inline" className="text-smoke">
            All open roles
          </ArrowLink>
          <Label>
            {hubNumber(role.hub.number)} · {role.commitment}
          </Label>
        </div>
        <MaskedLines lines={[role.title]} className="type-display text-display" />
        <p className="measure text-lead">{role.description}</p>
        {role.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {role.skills.map((s) => (
              <span key={s} className="label rounded-xs border border-line px-2 py-1 text-bone">
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* The hub, as a teaser: name, one-liner, thesis statement. Nothing more. */}
      <section className="grid grid-cols-1 gap-gutter px-gutter md:grid-cols-[1fr_1.4fr]">
        <div className="aspect-[4/3] overflow-hidden rounded-xs md:aspect-auto">
          <HubCover hub={role.hub} />
        </div>
        <div className="flex flex-col justify-between gap-10 rounded-xs bg-bone p-6 text-field md:p-8">
          <div className="flex justify-between gap-4">
            <Label tone="field">The hub</Label>
            <Label tone="field">By {owner.name}</Label>
          </div>
          <div>
            <p className="type-display text-headline">{role.hub.name}</p>
            {role.hub.oneLiner && <p className="mt-3 text-lead">{role.hub.oneLiner}</p>}
            {role.hub.thesis && (
              <p className="mt-8 border-t border-line-bone pt-6 text-lead">
                <span className="label mb-2 block">The bet</span>
                {role.hub.thesis.statement}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-edge py-16 pb-32">
        {isOwner ? (
          <ArrowLink href={`/hubs/${role.hub.slug}/team`} size="hero">
            This is your role. See who&apos;s interested
          </ArrowLink>
        ) : mine?.status === "ACCEPTED" ? (
          <div className="flex flex-col gap-8">
            <Label tone="signal">Accepted · You&apos;re on the team</Label>
            <p className="type-display text-headline">{owner.name.split(" ")[0]} said yes.</p>
            <ContactLine contact={contact} />
            <ArrowLink href={`/hubs/${role.hub.slug}`} size="lead" tone="signal">
              Go to {role.hub.name}
            </ArrowLink>
          </div>
        ) : mine?.status === "PENDING" ? (
          <div className="flex flex-col gap-6">
            <Label tone="signal" live>
              Interest sent · Waiting on {owner.name.split(" ")[0]}
            </Label>
            <blockquote className="measure border-l-2 border-line pl-4 text-lead">&ldquo;{mine.note}&rdquo;</blockquote>
            <SignalButtons signalId={mine.id} mode="withdraw" />
          </div>
        ) : mine?.status === "DECLINED" && role.status === "OPEN" ? (
          <p className="type-display text-headline">Not this time. There are other hubs looking.</p>
        ) : !isBuilder ? (
          <div className="flex flex-col gap-4">
            <p className="type-display text-headline">Joining teams is for builders.</p>
            <ArrowLink href="/me" size="lead">
              Add the Builder role to your profile
            </ArrowLink>
          </div>
        ) : role.status !== "OPEN" ? (
          <p className="type-display text-headline">This role has closed.</p>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Label>Interested?</Label>
              <p className="type-display mt-3 max-w-[14ch] text-headline">Tell {owner.name.split(" ")[0]} why you.</p>
            </div>
            <InterestForm roleId={role.id} ownerFirstName={owner.name.split(" ")[0]} />
          </div>
        )}
      </section>
    </PageWipe>
  );
}
