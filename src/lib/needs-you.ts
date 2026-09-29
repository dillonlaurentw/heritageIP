import "server-only";
import { db } from "./db";
import type { RingNode } from "./ring";

export type NeedsYouItem = {
  id: string;
  /** Round avatar for a person, soft square for an agent or a firm. */
  who: { kind: "person" | "agent" | "open"; name: string; mark?: string };
  title: string;
  detail: string;
  href: string;
  urgent?: boolean;
};

const SIGNAL_LINE = {
  ROLE_INTEREST: (from: string, ws: string) => `${from} is interested in a role at ${ws}`,
  ROLE_INVITE: (from: string, ws: string) => `${from} from ${ws} would like to talk`,
  BACKER_INTEREST: (from: string, ws: string) => `${from} would like to follow ${ws}`,
  MENTOR_REQUEST: (from: string, ws: string) => `${from} asked you to mentor ${ws}`,
  PARTNER_INTRO: (from: string, ws: string) => `${from} from ${ws} asked for an intro`,
} as const;

/**
 * The short list on "You": requests waiting on you, the next step on the
 * path, and open chairs the plan needs filled. Most important first.
 */
export async function needsYou(
  viewerId: string,
  current: { id: string; slug: string; name: string; canEdit: boolean } | null,
  ring: RingNode[],
): Promise<NeedsYouItem[]> {
  const items: NeedsYouItem[] = [];
  const pending = await db.signal.findMany({
    where: { toUserId: viewerId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, kind: true, note: true, fromUser: { select: { name: true } }, workspace: { select: { name: true } } },
  });
  for (const s of pending) {
    items.push({
      id: `sig-${s.id}`,
      who: { kind: "person", name: s.fromUser.name },
      title: SIGNAL_LINE[s.kind](s.fromUser.name, s.workspace?.name ?? "your company"),
      detail: s.note.length > 90 ? `${s.note.slice(0, 88)}…` : s.note,
      href: "/network/connections",
      urgent: true,
    });
  }

  if (current?.canEdit) {
    const [thesis, plan] = await Promise.all([
      db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: current.id, systemKey: "thesis" } }, select: { archivedAt: true } }),
      db.page.findUnique({
        where: { workspaceId_systemKey: { workspaceId: current.id, systemKey: "gamePlan" } },
        select: { archivedAt: true, _count: { select: { children: { where: { archivedAt: null } } } } },
      }),
    ]);
    if (!thesis || thesis.archivedAt) {
      items.push({
        id: "thesis",
        who: { kind: "agent", name: "Strategist", mark: "St" },
        title: "Turn the idea into a thesis",
        detail: "Three questions, then a draft you can change. Nothing is saved until you use it.",
        href: `/w/${current.slug}/thesis`,
      });
    } else if (!plan || plan.archivedAt || plan._count.children === 0) {
      items.push({
        id: "plan",
        who: { kind: "agent", name: "Planner", mark: "Pl" },
        title: "Build the game plan",
        detail: "Steps from your thesis, each saying who it needs.",
        href: `/w/${current.slug}/plan`,
      });
    }
  }

  for (const n of ring.filter((r) => r.state === "open").slice(0, 3)) {
    items.push({
      id: `chair-${n.id}`,
      who: { kind: "open", name: n.name },
      title: n.id.startsWith("r-") ? `Fill “${n.name}”` : `Find ${n.name.charAt(0).toLowerCase()}${n.name.slice(1)}`,
      detail: n.note,
      href: n.href ?? "/network",
    });
  }
  return items;
}
