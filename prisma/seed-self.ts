/* Your Self (Self3): Maya's is filled in, with one "Is this you?" waiting. */
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../src/generated/prisma/client";
import { addSuggestions, applySelfOp, selfFromOnboarding, type Facet, type SelfDoc } from "../src/lib/self-doc";

export async function seedSelf(db: PrismaClient, idOf: (key: string) => string) {
  const maya = await db.profile.findUniqueOrThrow({ where: { userId: idOf("maya") } });
  const now = new Date(Date.now() - 3 * 86_400_000).toISOString();
  let doc: SelfDoc = selfFromOnboarding(maya, now, randomUUID);
  const add = (facet: Facet, text: string) => {
    const r = applySelfOp(doc, { type: "add", facet, text }, now, randomUUID);
    if (r.ok) doc = r.doc;
  };
  add("WHY", "I grew up in Peniche and watched the harbour empty out. I want work that stays on the coast.");
  add("NONNEG", "Production stays local. No partner who wants it moved offshore.");
  add("ENERGY", "Drains: pitching, and long calls that end without a decision.");
  doc = addSuggestions(
    doc,
    [
      {
        facet: "DECIDE",
        text: "You test on a small scale before you commit, then move fast.",
        why: "Your thesis answers and your plan both start with a small wet-transport test.",
      },
    ],
    new Date().toISOString(),
    randomUUID,
  );
  await db.profile.update({ where: { userId: maya.userId }, data: { selfDoc: doc as object } });
}
