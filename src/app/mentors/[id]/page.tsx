import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ContactLine } from "@/components/people/PersonBlurb";
import { SignalButtons } from "@/components/people/SignalButtons";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { hubOptionsFor } from "@/lib/hubs";
import { mentorSelect } from "@/lib/mentors";
import { STATUS_LABEL } from "@/lib/signal-rules";
import { contactsFor } from "@/lib/signals";
import { requireOnboarded } from "@/lib/session";
import { MentorRequestForm } from "./MentorRequestForm";
import { OpenToggle } from "./OpenToggle";

export const metadata: Metadata = { title: "Mentor · SELF" };

export default async function MentorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hub?: string; step?: string }>;
}) {
  const viewer = await requireOnboarded();
  const mentor = await db.user.findUnique({ where: { id: (await params).id }, select: mentorSelect });
  const p = mentor?.profile;
  if (!mentor || !p?.roles.includes("MENTOR")) notFound();
  const { hub: hubSlug, step } = await searchParams;
  const isMe = mentor.id === viewer.user.id;
  const first = mentor.name.split(" ")[0];

  const [hubs, requests, contacts, mentoring] = await Promise.all([
    isMe ? [] : hubOptionsFor(viewer.user.id, (needs) => needs.includes("MENTOR")),
    db.signal.findMany({
      where: { kind: "MENTOR_REQUEST", toUserId: mentor.id, fromUserId: viewer.user.id },
      orderBy: { createdAt: "desc" },
      include: { hub: { select: { name: true } }, planStep: { select: { title: true } } },
    }),
    contactsFor(viewer.user.id, [mentor.id]),
    db.signal.count({ where: { kind: "MENTOR_REQUEST", toUserId: mentor.id, status: "ACCEPTED" } }),
  ]);
  const initialHub = hubs.find((h) => h.slug === hubSlug) ?? null;
  const connected = requests.some((r) => r.status === "ACCEPTED");

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href="/mentors" size="inline" className="text-smoke">
            All mentors
          </ArrowLink>
          <Label>
            {p.location ?? "Mentor"}
            {mentoring > 0 && ` · ${mentoring} ${mentoring === 1 ? "builder" : "builders"} mentored on SELF`}
          </Label>
        </div>
        {!p.mentorOpen && <Label tone="signal">Paused · Not taking new requests</Label>}
        <MaskedLines lines={[mentor.name]} className="type-display text-display" />
        {p.headline && <p className="measure text-lead">{p.headline}</p>}
        <div className="flex flex-wrap gap-2">
          {p.focusAreas.map((f) => (
            <span key={f} className="label rounded-xs border border-line px-2 py-1 text-bone">
              {f}
            </span>
          ))}
        </div>
      </section>

      {p.mentorNote && (
        <section className="bg-bone px-edge py-16 text-field">
          <Label tone="field">How {first} can help</Label>
          <p className="type-display mt-6 max-w-[34ch] text-statement">{p.mentorNote}</p>
        </section>
      )}

      <section className="px-edge py-16 pb-32">
        {isMe ? (
          <div className="flex flex-col gap-6">
            <Label tone="signal">This is your mentor profile</Label>
            <p className="measure text-body text-smoke">Edit your focus areas and note on your profile. Requests arrive in Connections.</p>
            <div className="flex flex-wrap items-center gap-6">
              <OpenToggle open={p.mentorOpen} />
              <ArrowLink href="/me" size="inline">
                Edit profile
              </ArrowLink>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col gap-8">
              <div>
                <Label>Ask for help</Label>
                <p className="type-display mt-3 max-w-[14ch] text-headline">An hour of {first}&apos;s time.</p>
              </div>
              {connected && <ContactLine contact={contacts.get(mentor.id)} />}
              {requests.length > 0 && (
                <div className="flex flex-col border-t border-line">
                  {requests.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
                      <div>
                        <Label tone={r.status === "PENDING" || r.status === "ACCEPTED" ? "signal" : "smoke"}>{STATUS_LABEL[r.status]}</Label>
                        <p className="text-body font-semibold">
                          {r.hub?.name}
                          {r.planStep && <span className="font-normal text-smoke"> · {r.planStep.title}</span>}
                        </p>
                      </div>
                      {r.status === "PENDING" && <SignalButtons signalId={r.id} mode="withdraw" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!p.mentorOpen ? (
              <p className="type-display text-headline">{first} has paused new requests. Check back soon.</p>
            ) : hubs.length ? (
              <MentorRequestForm
                mentorId={mentor.id}
                firstName={first}
                hubs={hubs}
                initialHubId={initialHub?.id ?? null}
                initialStepId={initialHub ? (step ?? null) : null}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <p className="type-display text-headline">Mentorship starts from a hub.</p>
                <ArrowLink href="/hubs/new" size="lead" tone="signal">
                  Start a hub first
                </ArrowLink>
              </div>
            )}
          </div>
        )}
      </section>
    </PageWipe>
  );
}
