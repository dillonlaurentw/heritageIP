/*
 * Phase 10 demo data: two weeks of agent runs so Admin → AI usage has
 * something to show. Deterministic (no randomness), so re-seeding is stable.
 */
import type { PrismaClient } from "../src/generated/prisma/client";

type IdOf = (key: string) => string;
const DAY = 86_400_000;

export async function seedUsage(db: PrismaClient, idOf: IdOf) {
  const [tide, bakery, ground] = await Promise.all(
    ["tidewater-kelp", "night-shift-bakery", "ground-truth"].map((slug) => db.workspace.findUniqueOrThrow({ where: { slug }, select: { id: true } })),
  );
  const who: [string, string][] = [
    ["maya", tide.id],
    ["dev", tide.id],
    ["ana", bakery.id],
    ["kwame", ground.id],
  ];
  const purposes: [string, number, number][] = [
    ["thesis.questions", 2400, 600],
    ["thesis.draft", 3100, 1400],
    ["plan.generate", 3600, 2200],
    ["page.assist", 5200, 700],
    ["workspace.chat", 7800, 900],
    ["sim.turn", 1900, 250],
  ];
  const rows = [];
  for (let day = 13; day >= 0; day--) {
    for (const [i, [key, workspaceId]] of who.entries()) {
      const count = (day * 7 + i * 3) % 5; // 0–4 runs a day, varying by person
      for (let n = 0; n < count; n++) {
        const [purpose, input, output] = purposes[(day + i + n) % purposes.length];
        const cached = purpose === "workspace.chat" && n > 0;
        rows.push({
          userId: idOf(key),
          workspaceId,
          purpose,
          model: "claude-opus-5",
          status: (day === 3 && i === 1 && n === 0 ? "REFUSED" : "OK") as "OK" | "REFUSED",
          inputTokens: cached ? 900 : input + n * 150,
          cacheReadTokens: cached ? input : 0,
          outputTokens: output + ((day * 37) % 300),
          durationMs: 4000 + ((day * 911 + n * 373) % 9000),
          createdAt: new Date(Date.now() - day * DAY - (n + 1) * 3_600_000),
        });
      }
    }
  }
  await db.agentRun.createMany({ data: rows });
  console.log(`Seeded ${rows.length} agent runs.`);
}
