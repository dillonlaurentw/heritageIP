import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotAnOffer } from "@/components/backers/NotAnOffer";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { HubCover } from "@/components/mosaic/HubCover";
import { ContactLine } from "@/components/people/PersonBlurb";
import { SignalButtons } from "@/components/people/SignalButtons";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { canSeeTeaser } from "@/lib/backers";
import { db } from "@/lib/db";
import { hubNumber, STAGE_LABEL } from "@/lib/hubs";
import { sortSteps, STAGE_COPY } from "@/lib/plan-order";
import { contactsFor } from "@/lib/signals";
import { requireOnboarded } from "@/lib/session";
import { THESIS_FIELDS } from "@/lib/thesis-schema";
import { BackerInterestForm } from "./BackerInterestForm";

export const metadata: Metadata = { title: "Hub · For backers · SELF" };

const pad = (n: number) => String(n).padStart(2, "0");

/** The backer teaser: exactly what the owner agreed to show, nothing more. */
export default async function BackerHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const hub = await db.hub.findUnique({
    where: { slug: (await params).slug },
    select: {
      id: true, slug: true, name: true, number: true, oneLiner: true, stage: true, sector: true, backerAsk: true,
      discoverable: true, ownerId: true, coverLayout: true, coverTone: true, coverImageUrl: true,
      thesis: true,
      owner: { select: { name: true, profile: { select: { headline: true } } } },
      members: { select: { role: true, user: { select: { name: true, profile: { select: { headline: true } } } } } },
      planSteps: { select: { id: true, stage: true, position: true, doneAt: true } },
    },
  });
  if (!hub || !(await canSeeTeaser(hub, viewer))) notFound();

  const isOwner = hub.ownerId === viewer.user.id;
  const mine = await db.signal.findFirst({
    where: { kind: "BACKER_INTEREST", hubId: hub.id, fromUserId: viewer.user.id },
    orderBy: { createdAt: "desc" },
  });
  const contact = (await contactsFor(viewer.user.id, [hub.ownerId])).get(hub.ownerId);
  const steps = sortSteps(hub.planSteps);
  const done = steps.filter((s) => s.doneAt).length;
  const current = steps.find((s) => !s.doneAt)?.stage;
  const first = hub.owner.name.split(" ")[0];

  return (
    <PageWipe>
      <section className="flex flex-col gap-8 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <ArrowLink href="/backers" size="inline" className="text-smoke">
            {isOwner ? "Discover" : "All hubs"}
          </ArrowLink>
          <Label>
            {hubNumber(hub.number)} · {hub.sector} · {STAGE_LABEL[hub.stage]}
          </Label>
        </div>
        {isOwner && <Label tone="signal">Preview · This is what backers see</Label>}
        <MaskedLines lines={[hub.name]} className="type-display text-display" />
        {hub.oneLiner && <p className="measure text-lead text-smoke">{hub.oneLiner}</p>}
      </section>

      <div className="px-gutter">
        <div className="h-[clamp(14rem,44vh,32rem)] overflow-hidden rounded-xs">
          <HubCover hub={hub} />
        </div>
      </div>

      {hub.thesis && (
        <section className="mt-gutter bg-bone px-edge py-16 text-field">
          <Label tone="field">The thesis</Label>
          <p className="type-display mt-8 max-w-[30ch] text-statement">{hub.thesis.statement}</p>
          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-8 border-t border-line-bone pt-8 md:grid-cols-2 xl:grid-cols-3">
            {THESIS_FIELDS.map((f) => (
              <div key={f.key}>
                <Label tone="field">{f.label}</Label>
                <p className="mt-2 text-body">{hub.thesis![f.key]}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-10 border-b border-line px-edge py-14 md:grid-cols-3">
        <div>
          <Label>The team</Label>
          <ul className="mt-4 flex flex-col gap-3">
            <li>
              <p className="text-lead font-semibold">{hub.owner.name}</p>
              <p className="text-small text-smoke">Founder{hub.owner.profile?.headline && ` · ${hub.owner.profile.headline}`}</p>
            </li>
            {hub.members.map((m) => (
              <li key={m.user.name}>
                <p className="text-lead font-semibold">{m.user.name}</p>
                <p className="text-small text-smoke">{m.role}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label>Progress</Label>
          {steps.length ? (
            <>
              <p className="type-display mt-4 text-headline">
                {pad(done)}/{pad(steps.length)}
              </p>
              <p className="text-small text-smoke">game-plan steps done{current && ` · now in ${STAGE_COPY[current].label}`}</p>
            </>
          ) : (
            <p className="mt-4 text-body text-smoke">No game plan yet.</p>
          )}
        </div>
        <div>
          <Label>What they want from a backer</Label>
          <p className="mt-4 text-lead">{hub.backerAsk ?? "Not specified."}</p>
        </div>
      </section>

      <section className="px-edge py-16 pb-24">
        {isOwner ? (
          <ArrowLink href={`/hubs/${hub.slug}/backers`} size="lead">
            Back to your backer settings
          </ArrowLink>
        ) : mine?.status === "ACCEPTED" ? (
          <div className="flex flex-col gap-6">
            <Label tone="signal">Accepted · Connected</Label>
            <p className="type-display text-headline">{first} would like to talk.</p>
            <ContactLine contact={contact} />
          </div>
        ) : mine?.status === "PENDING" ? (
          <div className="flex flex-col gap-6">
            <Label tone="signal" live>
              Interest sent · Waiting on {first}
            </Label>
            <blockquote className="measure border-l-2 border-line pl-4 text-lead">&ldquo;{mine.note}&rdquo;</blockquote>
            <SignalButtons signalId={mine.id} mode="withdraw" />
          </div>
        ) : mine?.status === "DECLINED" ? (
          <p className="type-display text-headline">{first} passed for now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Label>Interested?</Label>
              <p className="type-display mt-3 max-w-[14ch] text-headline">Tell {first} why.</p>
            </div>
            <BackerInterestForm hubId={hub.id} founderFirstName={first} />
          </div>
        )}
      </section>
      <NotAnOffer />
    </PageWipe>
  );
}
