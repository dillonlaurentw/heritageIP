import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requestMentorAction } from "@/app/actions/network";
import { RequestForm } from "@/components/network/RequestForm";
import { Screen } from "@/components/shell/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { contactsFor, workspaceOptions } from "@/lib/network";
import { requireOnboarded } from "@/lib/session";
import { MentorSwitch } from "./MentorSwitch";

export const metadata: Metadata = { title: "Mentor" };

export default async function MentorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ws?: string; step?: string }> }) {
  const viewer = await requireOnboarded();
  const { id } = await params;
  const { ws, step } = await searchParams;
  const m = await db.profile.findUnique({
    where: { userId: id },
    select: { userId: true, roles: true, headline: true, location: true, focusAreas: true, mentorNote: true, mentorOpen: true, user: { select: { name: true } } },
  });
  if (!m || !m.roles.includes("MENTOR")) notFound();
  const self = m.userId === viewer.user.id;
  const [options, existing, contacts] = await Promise.all([
    self ? [] : workspaceOptions(viewer),
    db.signal.findFirst({ where: { kind: "MENTOR_REQUEST", fromUserId: viewer.user.id, toUserId: m.userId, status: { in: ["PENDING", "ACCEPTED"] } }, select: { status: true } }),
    contactsFor(viewer.user.id, [m.userId]),
  ]);
  const contact = contacts.get(m.userId);

  return (
    <Screen crumbs={[{ label: "Network", href: "/network" }, { label: "Mentors", href: "/network/mentors" }, { label: m.user.name }]} width="narrow">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={m.user.name} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{m.user.name}</h1>
            <p className="text-base text-fg-muted">{[m.headline, m.location].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        {m.mentorNote && <p className="text-md leading-relaxed">{m.mentorNote}</p>}
        <div className="flex flex-wrap gap-1">
          {m.focusAreas.map((a) => (
            <Tag key={a}>{a}</Tag>
          ))}
        </div>

        {contact && (
          <section className="rounded-lg bg-bg-subtle p-4 text-sm">
            <p className="text-xs font-medium text-fg-subtle">Contact (you&apos;re connected)</p>
            {contact.email && <p className="mt-1">{contact.email}</p>}
            {contact.link && <p className="text-fg-muted">{contact.link}</p>}
          </section>
        )}

        <div className="border-t border-border pt-5">
          {self ? (
            <MentorSwitch open={m.mentorOpen} />
          ) : existing ? (
            <p className="text-sm text-fg-muted">{existing.status === "ACCEPTED" ? "They said yes." : "You've asked. You'll hear back in Connections."}</p>
          ) : !m.mentorOpen ? (
            <p className="text-sm text-fg-muted">{m.user.name.split(" ")[0]} isn&apos;t taking new requests right now.</p>
          ) : (
            <RequestForm
              options={options}
              targetId={m.userId}
              send={requestMentorAction}
              cta="Ask for a conversation"
              placeholder="What you're working on, where you're stuck, and what you'd like to ask."
              defaultWs={ws}
              defaultStep={step}
              preferNeed="MENTOR"
            />
          )}
        </div>
      </div>
    </Screen>
  );
}
