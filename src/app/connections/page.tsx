import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { NotAnOffer } from "@/components/backers/NotAnOffer";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ContactLine, PersonBlurb } from "@/components/people/PersonBlurb";
import { SignalButtons } from "@/components/people/SignalButtons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/signal-rules";
import { partnerContactsFor } from "@/lib/partners";
import { contactsFor } from "@/lib/signals";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Connections · SELF" };

const KIND_LABEL: Record<string, string> = {
  ROLE_INTEREST: "Role",
  BACKER_INTEREST: "Backer interest · Interest only",
  MENTOR_REQUEST: "Mentorship",
  PARTNER_INTRO: "Intro",
};

const person = {
  id: true,
  name: true,
  profile: { select: { headline: true, strengths: true, buildingToward: true } },
} as const;

/**
 * Every signal you've sent or received, in one place: what's waiting on you,
 * what you're waiting on, and who you're connected to (with contacts).
 */
export default async function ConnectionsPage() {
  const viewer = await requireOnboarded();
  const me = viewer.user.id;
  const signals = await db.signal.findMany({
    where: { OR: [{ fromUserId: me }, { toUserId: me }] },
    orderBy: { updatedAt: "desc" },
    include: {
      fromUser: { select: person },
      toUser: { select: person },
      hub: { select: { name: true, slug: true, number: true } },
      roleOpening: { select: { id: true, title: true } },
      partner: { select: { id: true, name: true, slug: true, claimedById: true } },
      planStep: { select: { title: true } },
    },
  });

  const waiting = signals.filter((s) => s.status === "PENDING" && s.toUserId === me);
  const sent = signals.filter((s) => s.fromUserId === me && s.status !== "ACCEPTED");
  const connected = signals.filter((s) => s.status === "ACCEPTED");
  const contacts = await contactsFor(
    me,
    connected.map((s) => (s.fromUserId === me ? s.toUserId : s.fromUserId)),
  );

  // Intros I asked for: show the firm's contact, not the person who answered.
  const partnerContacts = await partnerContactsFor(
    me,
    connected.filter((s) => s.kind === "PARTNER_INTRO" && s.fromUserId === me && s.partner).map((s) => s.partner!.id),
  );

  const about = (s: (typeof signals)[number]) =>
    [KIND_LABEL[s.kind], s.partner?.name, s.roleOpening?.title, s.hub?.name, s.planStep && `Step: ${s.planStep.title}`]
      .filter(Boolean)
      .join(" · ");

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <Label>Connections</Label>
          <Label tone={waiting.length ? "signal" : "smoke"} live={waiting.length > 0}>
            {waiting.length ? `${waiting.length} waiting on you` : "All answered"}
          </Label>
        </div>
        <MaskedLines lines={["Your people."]} className="type-display text-display" />
      </section>

      {signals.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="No connections yet. Find a team to join." href="/roles" />
        </div>
      ) : (
        <div className="pb-32">
          {/* Waiting on you */}
          <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 md:grid-cols-[16rem_1fr]">
            <div>
              <Label tone={waiting.length ? "signal" : "smoke"}>01 · Waiting on you</Label>
            </div>
            <div className="flex flex-col gap-gutter">
              {waiting.length === 0 && <p className="text-body text-smoke">Nothing waiting.</p>}
              {waiting.map((s) => (
                <div key={s.id} className="flex flex-col gap-5 rounded-xs border border-signal p-5">
                  <Label tone="signal">{about(s)}</Label>
                  {s.kind === "PARTNER_INTRO" && s.partner && s.partner.claimedById !== me && (
                    <p className="text-small text-smoke">
                      {s.partner.name} hasn&apos;t claimed their profile, so you&apos;re answering as SELF&apos;s concierge.
                      Accepting emails the firm and the builder each other&apos;s details.
                    </p>
                  )}
                  <PersonBlurb
                    person={{
                      name: s.fromUser.name,
                      headline: s.fromUser.profile?.headline,
                      strengths: s.fromUser.profile?.strengths,
                      buildingToward: s.fromUser.profile?.buildingToward,
                    }}
                  />
                  <blockquote className="measure border-l-2 border-line pl-4 text-body">&ldquo;{s.note}&rdquo;</blockquote>
                  <SignalButtons signalId={s.id} mode="respond" />
                </div>
              ))}
            </div>
          </section>

          {/* Connected */}
          <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 md:grid-cols-[16rem_1fr]">
            <Label className="self-start">02 · Connected</Label>
            <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
              {connected.length === 0 && <p className="text-body text-smoke">No one yet.</p>}
              {connected.map((s) => {
                const other = s.fromUserId === me ? s.toUser : s.fromUser;
                if (s.kind === "PARTNER_INTRO" && s.fromUserId === me && s.partner) {
                  const pc = partnerContacts.get(s.partner.id);
                  return (
                    <div key={s.id} className="flex flex-col justify-between gap-6 rounded-xs bg-field-raised p-5">
                      <Label>{about(s)}</Label>
                      <Link href={`/partners/${s.partner.slug}` as Route} className="type-display text-title hover:underline">
                        {s.partner.name}
                      </Link>
                      <ContactLine contact={pc ? { email: pc.email, link: pc.website } : null} />
                    </div>
                  );
                }
                return (
                  <div key={s.id} className="flex flex-col justify-between gap-6 rounded-xs bg-field-raised p-5">
                    <Label>{about(s)}</Label>
                    <PersonBlurb person={{ name: other.name, headline: other.profile?.headline }} compact />
                    <ContactLine contact={contacts.get(other.id)} />
                    {s.hub && (
                      <Link href={`/hubs/${s.hub.slug}` as Route} className="text-small font-medium text-smoke hover:text-bone">
                        {s.hub.name} →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sent by you */}
          <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 md:grid-cols-[16rem_1fr]">
            <Label className="self-start">03 · Sent by you</Label>
            <div className="flex flex-col">
              {sent.length === 0 && <p className="text-body text-smoke">Nothing sent.</p>}
              {sent.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4 last:border-b-0">
                  <div>
                    <Label tone={s.status === "PENDING" ? "signal" : "smoke"}>{STATUS_LABEL[s.status]}</Label>
                    <p className="mt-1 text-lead font-semibold">
                      {s.roleOpening ? (
                        <Link href={`/roles/${s.roleOpening.id}` as Route} className="hover:underline">
                          {about(s)}
                        </Link>
                      ) : (
                        about(s)
                      )}
                    </p>
                    <p className="text-small text-smoke">To {s.toUser.name}</p>
                  </div>
                  {s.status === "PENDING" && <SignalButtons signalId={s.id} mode="withdraw" />}
                </div>
              ))}
            </div>
          </section>
          {signals.some((s) => s.kind === "BACKER_INTEREST") && <NotAnOffer />}
        </div>
      )}
    </PageWipe>
  );
}
