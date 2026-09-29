/**
 * Builds a company's ring from plain data (members, open roles, signals and
 * unfinished plan steps). Pure, so the rules are unit tested; the database
 * reads live in ring-data.ts.
 */
import { NEED_CHAIR, NEED_TAGS, NEED_THEME, needHref, NEEDS, type Need } from "./needs";
import type { RingNode, RingNodeState } from "./ring";

export type RingInput = {
  viewerId: string;
  slug: string;
  members: { userId: string; name: string; role: "OWNER" | "ADMIN" | "MEMBER" | "GUEST"; title: string | null }[];
  roles: { id: string; title: string; advisor: boolean; href: string; interested: number }[];
  signals: {
    id: string;
    kind: "ROLE_INTEREST" | "ROLE_INVITE" | "BACKER_INTEREST" | "MENTOR_REQUEST" | "PARTNER_INTRO";
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
    fromUserId: string;
    fromName: string;
    toUserId: string;
    toName: string;
    partner: { slug: string; name: string } | null;
    pageId: string | null;
  }[];
  openSteps: { id: string; title: string; needs: string[] }[];
};

const STATE_RANK: Record<RingNodeState, number> = { linked: 0, pending: 1, open: 2 };

export function buildRing(input: RingInput): RingNode[] {
  const nodes = new Map<string, RingNode>();
  const put = (key: string, n: RingNode) => {
    const cur = nodes.get(key);
    if (!cur || STATE_RANK[n.state] < STATE_RANK[cur.state]) nodes.set(key, n);
  };
  const memberIds = new Set(input.members.map((m) => m.userId));

  for (const m of input.members) {
    if (m.userId === input.viewerId) continue;
    const advisor = m.role === "GUEST";
    put(`u:${m.userId}`, {
      id: `m-${m.userId}`,
      theme: advisor ? "ADVISORS" : "COFOUNDERS",
      kind: "person",
      state: "linked",
      name: m.name,
      note: m.title || (advisor ? "guest" : "teammate"),
      href: `/w/${input.slug}/people`,
    });
  }

  for (const s of input.signals) {
    if (s.status === "DECLINED" || s.status === "WITHDRAWN") continue;
    const state: RingNodeState = s.status === "ACCEPTED" ? "linked" : "pending";
    if (s.kind === "PARTNER_INTRO" && s.partner) {
      put(`p:${s.partner.slug}`, {
        id: `s-${s.id}`,
        theme: "PARTNERS",
        kind: "firm",
        state,
        name: s.partner.name,
        note: state === "linked" ? "working together" : "intro pending",
        href: `/network/partners/${s.partner.slug}`,
      });
    } else if (s.kind === "MENTOR_REQUEST") {
      put(`u:${s.toUserId}`, {
        id: `s-${s.id}`,
        theme: "ADVISORS",
        kind: "person",
        state,
        name: s.toName,
        note: state === "linked" ? "mentor" : "asked to mentor",
        href: `/network/mentors/${s.toUserId}`,
      });
    } else if (s.kind === "BACKER_INTEREST") {
      put(`b:${s.fromUserId}`, {
        id: `s-${s.id}`,
        theme: "CAPITAL",
        kind: "person",
        state,
        name: s.fromName,
        note: state === "linked" ? "backer, in touch" : "interested",
        href: "/network/connections",
      });
    } else if (s.kind === "ROLE_INVITE" && !memberIds.has(s.toUserId)) {
      // Someone the company reached out to: talking, not yet on the team.
      put(`u:${s.toUserId}`, {
        id: `s-${s.id}`,
        theme: "COFOUNDERS",
        kind: "person",
        state: "pending",
        name: s.toName,
        note: state === "linked" ? "talking" : "invited to talk",
        href: "/messages",
      });
    } else if (s.kind === "ROLE_INTEREST" && state === "pending" && !memberIds.has(s.fromUserId)) {
      put(`u:${s.fromUserId}`, {
        id: `s-${s.id}`,
        theme: "COFOUNDERS",
        kind: "person",
        state,
        name: s.fromName,
        note: "interested in a role",
        href: "/network/connections",
      });
    }
  }

  // Open chairs: open roles first, then needs on unfinished steps nobody is working on yet.
  for (const r of input.roles) {
    put(`r:${r.id}`, {
      id: `r-${r.id}`,
      theme: r.advisor ? "ADVISORS" : "COFOUNDERS",
      kind: "open",
      state: "open",
      name: r.title,
      note: r.interested > 0 ? `open role · ${r.interested} interested` : "open role",
      href: r.href,
    });
  }
  const askedFor = new Set(input.signals.filter((s) => s.pageId && s.status !== "DECLINED" && s.status !== "WITHDRAWN").map((s) => s.pageId));
  const seenNeed = new Set<Need>();
  const hasOpenRole = input.roles.some((r) => !r.advisor);
  for (const step of input.openSteps) {
    if (askedFor.has(step.id)) continue;
    for (const raw of step.needs) {
      if (!(NEED_TAGS as readonly string[]).includes(raw)) continue;
      const need = raw as Need;
      if (seenNeed.has(need)) continue;
      if (need === "COFOUNDER" && hasOpenRole) continue;
      seenNeed.add(need);
      put(`n:${need}`, {
        id: `n-${need}`,
        theme: NEED_THEME[need],
        kind: "open",
        state: "open",
        name: NEED_CHAIR[need],
        note: `for “${step.title}”`,
        href:
          need === "COFOUNDER"
            ? `/w/${input.slug}/matches`
            : need === "MENTOR"
              ? `/w/${input.slug}/matches?chair=need:MENTOR`
              : needHref(need, input.slug, step.id),
      });
    }
  }
  return [...nodes.values()];
}

/** Label for a need in running text ("Legal"). */
export const needLabel = (n: Need) => NEEDS[n].label;
