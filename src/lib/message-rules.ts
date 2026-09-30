/**
 * Messages and trial weeks: pure rules, unit tested in
 * __tests__/message-rules.test.ts. Database code lives in messages.ts.
 */

/** One conversation per pair, whatever order the two ids arrive in. */
export function pairKey(a: string, b: string) {
  if (!a || !b || a === b) throw new Error("A conversation needs two different people.");
  return [a, b].sort().join(":");
}

/**
 * Two people may message each other when they already work together (a
 * shared TEAM workspace), one of them said yes to the other (an ACCEPTED
 * signal of any kind), or a host picked the other for an opportunity.
 * Everything else starts as a request, not a message.
 */
export function canMessage(facts: { sharedWorkspace: boolean; acceptedSignal: boolean; pickedGuest?: boolean }) {
  return facts.sharedWorkspace || facts.acceptedSignal || !!facts.pickedGuest;
}

export type TrialStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

export type TrialData = {
  workspaceId: string;
  workspaceName: string;
  roleId?: string | null;
  title: string;
  focus: string;
  status: TrialStatus;
  answeredAt?: string;
};

/** Who can propose a trial week: an owner or admin of the company, to someone not already in it. */
export function canProposeTrial(proposerRole: string | null, otherIsMember: boolean): string | null {
  if (proposerRole !== "OWNER" && proposerRole !== "ADMIN") return "Only the company's owners and admins can propose a trial week.";
  if (otherIsMember) return "They're already part of this company.";
  return null;
}

/** The other person accepts or passes; the proposer can withdraw. Answered proposals stay answered. */
export function answerTrial(
  trial: TrialData,
  viewerId: string,
  proposerId: string,
  action: "accept" | "decline" | "withdraw",
): { ok: true; status: TrialStatus } | { ok: false; reason: string } {
  if (trial.status !== "PENDING") return { ok: false, reason: "This proposal was already answered." };
  if (action === "withdraw") return viewerId === proposerId ? { ok: true, status: "WITHDRAWN" } : { ok: false, reason: "Only the person who proposed it can withdraw it." };
  if (viewerId === proposerId) return { ok: false, reason: "The other person answers this one." };
  return { ok: true, status: action === "accept" ? "ACCEPTED" : "DECLINED" };
}

/** The member title someone gets when a trial week starts. */
export const trialTitle = (title: string) => `Trial week: ${title.trim()}`.slice(0, 80);

const STOP = new Set(
  "a an and the of to for in on with at by from or but is are be i we you they it my our your their this that someone who what need needs more less than as into".split(" "),
);
const words = (t: string) =>
  new Set(
    t
      .toLowerCase()
      .replace(/[^\p{L}\p{N} ]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => w.replace(/(ing|ers|er|s)$/, "")),
  );

/**
 * Order people for an open chair: those whose strengths share words with what
 * the chair needs come first; ties keep the input order. Used for ORDER only.
 * No number is ever shown to anyone.
 */
export function orderForChair<T extends { strengths: string; note: string }>(need: string, people: T[]): T[] {
  const want = words(need);
  const overlap = (p: T) => [...words(`${p.strengths} ${p.note}`)].filter((w) => want.has(w)).length;
  return people
    .map((p, i) => ({ p, i, o: overlap(p) }))
    .sort((a, b) => b.o - a.o || a.i - b.i)
    .map((x) => x.p);
}
