import type { Metadata } from "next";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { InboxList } from "./InboxList";

export const metadata: Metadata = { title: "Inbox" };

/** Mentions, comments, assignments, requests and simulations, newest first. */
export default async function InboxPage() {
  const viewer = await requireOnboarded();
  const items = await db.notification.findMany({
    where: { userId: viewer.user.id },
    orderBy: { createdAt: "desc" },
    take: 150,
    select: {
      id: true,
      kind: true,
      text: true,
      href: true,
      readAt: true,
      createdAt: true,
      actor: { select: { name: true } },
      workspace: { select: { name: true } },
    },
  });
  return (
    <Screen crumbs={[{ label: "Inbox" }]} title="Inbox" description="Mentions, comments, assignments and requests. Email only for the important ones." width="narrow">
      <InboxList
        items={items.map((n) => ({
          id: n.id,
          kind: n.kind,
          text: n.text,
          href: n.href,
          read: Boolean(n.readAt),
          at: n.createdAt.toISOString(),
          actor: n.actor?.name ?? "SELF",
          workspace: n.workspace?.name ?? null,
        }))}
      />
    </Screen>
  );
}
