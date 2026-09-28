import type { Metadata } from "next";
import { NotAnOffer } from "@/components/backers/NotAnOffer";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ContactLine, PersonBlurb } from "@/components/people/PersonBlurb";
import { SignalButtons } from "@/components/people/SignalButtons";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { getOwnedHub, hubNumber } from "@/lib/hubs";
import type { FOCUS_AREAS } from "@/lib/profile-schema";
import { STATUS_LABEL } from "@/lib/signal-rules";
import { contactsFor } from "@/lib/signals";
import { requireOnboarded } from "@/lib/session";
import { DiscoveryPanel } from "./DiscoveryPanel";

export const metadata: Metadata = { title: "Backers · SELF" };

export default async function HubBackersPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const hub = await getOwnedHub((await params).slug, viewer);
  const signals = await db.signal.findMany({
    where: { kind: "BACKER_INTEREST", hubId: hub.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { fromUser: { select: { id: true, name: true, profile: { select: { headline: true, backerNote: true, focusAreas: true } } } } },
  });
  const contacts = await contactsFor(viewer.user.id, signals.map((s) => s.fromUserId));

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href={`/hubs/${hub.slug}`} size="inline" className="text-smoke">
            {hub.name}
          </ArrowLink>
          <Label>{hubNumber(hub.number)} · Backers</Label>
        </div>
        <MaskedLines lines={["Let backers", "find you."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">
          Backers on SELF can browse hubs that opt in and signal interest. You decide who to talk to. Nothing is offered,
          priced or committed here.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-10 border-t border-line px-edge py-12 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-6">
          <Label>01 · Discovery</Label>
          <p className="type-display text-title">What backers see if you open up</p>
          <ul className="flex flex-col gap-2 text-body text-smoke">
            <li>Your hub&apos;s name, cover, one-liner, stage and sector</li>
            <li>Your thesis</li>
            <li>Your team&apos;s names and roles</li>
            <li>Game-plan progress (steps done, not the steps)</li>
            <li>What you&apos;d want from a backer</li>
          </ul>
          <p className="text-body text-smoke">
            Never: your contact details (until you accept), your plan&apos;s steps, or anything about money.
          </p>
          {hub.discoverable && (
            <ArrowLink href={`/backers/${hub.slug}`} size="inline">
              Preview what backers see
            </ArrowLink>
          )}
        </div>
        <DiscoveryPanel
          hubId={hub.id}
          initial={{
            discoverable: hub.discoverable,
            sector: hub.sector as (typeof FOCUS_AREAS)[number] | null,
            backerAsk: hub.backerAsk ?? "",
          }}
        />
      </section>

      <section className="border-t border-line px-edge py-12 pb-24">
        <Label>02 · Interest · {String(signals.length).padStart(2, "0")}</Label>
        <div className="mt-8 flex flex-col gap-gutter">
          {signals.length === 0 && <p className="text-lead text-smoke">No backer interest yet.</p>}
          {signals.map((s) => (
            <div key={s.id} className={`flex flex-col gap-5 rounded-xs p-5 ${s.status === "PENDING" ? "border border-signal" : "bg-field-raised"}`}>
              <div className="flex justify-between gap-4">
                <Label tone={s.status === "PENDING" ? "signal" : "smoke"} live={s.status === "PENDING"}>
                  {STATUS_LABEL[s.status]}
                </Label>
                {s.fromUser.profile?.focusAreas.length ? <Label>{s.fromUser.profile.focusAreas.join(" · ")}</Label> : null}
              </div>
              <PersonBlurb person={{ name: s.fromUser.name, headline: s.fromUser.profile?.headline }} compact />
              {s.fromUser.profile?.backerNote && (
                <p className="measure text-small text-smoke">What they back: {s.fromUser.profile.backerNote}</p>
              )}
              <blockquote className="measure border-l-2 border-line pl-4 text-body">&ldquo;{s.note}&rdquo;</blockquote>
              {s.status === "PENDING" && <SignalButtons signalId={s.id} mode="respond" acceptLabel="Accept · Swap contacts" />}
              {s.status === "ACCEPTED" && <ContactLine contact={contacts.get(s.fromUserId)} />}
            </div>
          ))}
        </div>
      </section>
      <NotAnOffer />
    </PageWipe>
  );
}
