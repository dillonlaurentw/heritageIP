import type { Metadata } from "next";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { contactsFor, partnerContactsFor } from "@/lib/network";
import { requireOnboarded } from "@/lib/session";
import { ConnectionList, type ConnectionItem } from "./ConnectionList";

export const metadata: Metadata = { title: "Connections" };

/** The one inbox for every signal: roles, mentors, partner intros and backer interest. */
export default async function ConnectionsPage() {
  const viewer = await requireOnboarded();
  const me = viewer.user.id;
  const signals = await db.signal.findMany({
    where: { OR: [{ toUserId: me }, { fromUserId: me }] },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      kind: true,
      status: true,
      note: true,
      createdAt: true,
      respondedAt: true,
      fromUserId: true,
      toUserId: true,
      fromUser: { select: { name: true, profile: { select: { headline: true } } } },
      toUser: { select: { name: true, profile: { select: { headline: true } } } },
      workspace: { select: { id: true, name: true, slug: true } },
      page: { select: { id: true, title: true } },
      partner: { select: { id: true, name: true, slug: true, claimedById: true } },
    },
  });
  const others = signals.map((s) => (s.fromUserId === me ? s.toUserId : s.fromUserId));
  const [contacts, partnerContacts, memberships] = await Promise.all([
    contactsFor(me, others),
    partnerContactsFor(me, signals.flatMap((s) => (s.partner ? [s.partner.id] : []))),
    db.workspaceMember.findMany({
      where: { workspaceId: { in: signals.flatMap((s) => (s.workspace ? [s.workspace.id] : [])) } },
      select: { workspaceId: true, userId: true, role: true },
    }),
  ]);
  const roleOf = (ws: string, user: string) => memberships.find((m) => m.workspaceId === ws && m.userId === user)?.role ?? null;

  const items: ConnectionItem[] = signals.map((s) => {
    const received = s.toUserId === me;
    const otherId = received ? s.fromUserId : s.toUserId;
    const other = received ? s.fromUser : s.toUser;
    const partnerContact = s.partner && !received ? partnerContacts.get(s.partner.id) : undefined;
    const c = contacts.get(otherId);
    return {
      id: s.id,
      kind: s.kind,
      status: s.status,
      received,
      note: s.note,
      at: s.createdAt.toISOString(),
      person: { name: other.name, headline: other.profile?.headline ?? null },
      workspace: s.workspace ? { name: s.workspace.name, slug: s.workspace.slug } : null,
      about: s.page?.title ?? null,
      aboutHref: s.page && s.workspace && roleOf(s.workspace.id, me) ? `/w/${s.workspace.slug}/${s.page.id}` : s.kind === "ROLE_INTEREST" && s.page ? `/network/roles/${s.page.id}` : null,
      partner: s.partner ? { name: s.partner.name, slug: s.partner.slug, concierge: received && s.partner.claimedById !== me } : null,
      contact: partnerContact ? { email: partnerContact.email, link: partnerContact.website } : c ? { email: c.email, link: c.link } : null,
      canAddToWorkspace:
        s.kind === "ROLE_INTEREST" &&
        s.status === "ACCEPTED" &&
        received &&
        !!s.workspace &&
        ["OWNER", "ADMIN"].includes(roleOf(s.workspace.id, me) ?? "") &&
        !roleOf(s.workspace.id, s.fromUserId),
    };
  });

  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Connections" }]}
      title="Connections"
      description="Every request you've sent or received. When someone says yes, you both see each other's details here."
      width="narrow"
    >
      <ConnectionList items={items} />
    </Screen>
  );
}
