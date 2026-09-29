import "server-only";
import { randomUUID } from "node:crypto";
import { runAgent, selfSuggestAgent } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { addSuggestions, applySelfOp, parseSelfDoc, selfFromOnboarding, type SelfDoc, type SelfOp } from "./self-doc";
import type { Viewer } from "./session";
import { readThesis } from "./thesis";

type ProfileForSelf = Viewer["profile"];

/** Your Self as stored, or (until you first change it) the one built from your onboarding answers. */
export function selfOf(profile: ProfileForSelf): { doc: SelfDoc; saved: boolean } {
  const stored = parseSelfDoc(profile.selfDoc);
  if (stored) return { doc: stored, saved: true };
  return { doc: selfFromOnboarding(profile, new Date(0).toISOString(), () => randomUUID()), saved: false };
}

async function write(userId: string, doc: SelfDoc) {
  await db.profile.update({ where: { userId }, data: { selfDoc: doc as unknown as Prisma.InputJsonValue, personaUpdatedAt: new Date() } });
}

/** One change to your Self: add, edit or remove a line, or answer a suggestion. */
export async function changeSelf(viewer: Viewer, op: SelfOp) {
  const { doc } = selfOf(viewer.profile);
  const res = applySelfOp(doc, op, new Date().toISOString(), () => randomUUID());
  if (!res.ok) return res;
  await write(viewer.user.id, res.doc);
  return { ok: true as const };
}

/** What SELF has seen you say and do: thesis fields from companies you own, and your thesis answers. */
async function evidenceFor(viewer: Viewer) {
  const owned = await db.workspaceMember.findMany({
    where: { userId: viewer.user.id, role: "OWNER", workspace: { kind: "TEAM" } },
    select: { workspace: { select: { id: true, name: true } } },
    take: 5,
  });
  const evidence: { source: string; text: string }[] = [];
  for (const { workspace } of owned) {
    const t = await readThesis(workspace.id);
    if (!t) continue;
    const where = `your ${workspace.name} thesis`;
    if (t.contrarian) evidence.push({ source: where, text: `Contrarian belief: ${t.contrarian}` });
    if (t.whyUs) evidence.push({ source: where, text: `Why this builder: ${t.whyUs}` });
    if (t.statement) evidence.push({ source: where, text: `Thesis: ${t.statement}` });
  }
  const answers = await db.agentMessage.findMany({
    where: { thread: { userId: viewer.user.id, kind: "thesis" }, role: "USER" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { data: true },
  });
  for (const a of answers) {
    const d = a.data as { type?: string; answers?: { question: string; answer: string }[] } | null;
    for (const qa of d?.type === "answers" ? (d.answers ?? []) : []) {
      if (qa.answer.trim()) evidence.push({ source: "a thesis question", text: `Asked "${qa.question}", you answered: ${qa.answer.trim()}` });
    }
  }
  return evidence.slice(0, 24);
}

/** Ask your Self agent for "Is this you?" lines. They're stored as suggestions; nothing counts until you say yes. */
export async function findSuggestions(viewer: Viewer) {
  const { doc } = selfOf(viewer.profile);
  const res = await runAgent(
    selfSuggestAgent,
    {
      name: viewer.user.name,
      lines: doc.lines.map((l) => ({ facet: l.facet, text: l.text })),
      evidence: await evidenceFor(viewer),
      answered: doc.suggestions.filter((s) => s.status !== "PENDING").map((s) => s.text),
    },
    { userId: viewer.user.id },
  );
  if (!res.ok) return res;
  const before = doc.suggestions.filter((s) => s.status === "PENDING").length;
  const next = addSuggestions(doc, res.output.suggestions, new Date().toISOString(), () => randomUUID());
  const added = next.suggestions.filter((s) => s.status === "PENDING").length - before;
  await write(viewer.user.id, next);
  return { ok: true as const, added, demo: res.demo };
}
