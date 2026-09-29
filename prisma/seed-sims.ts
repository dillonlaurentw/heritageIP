/*
 * Phase 8 demo data: opt-ins, one written persona, one finished simulation
 * with its conversation starters. Everything is labelled SIMULATION in the UI.
 */
import type { PrismaClient } from "../src/generated/prisma/client";

type IdOf = (key: string) => string;
const DAY = 86_400_000;

export async function seedSimulations(db: PrismaClient, idOf: IdOf) {
  // ── Personal agents: opt-ins, one written persona, one finished simulation. ──
  const optIn = ["maya", "dev", "lena", "tomas", "ana"];
  for (const key of optIn) {
    await db.profile.update({ where: { userId: idOf(key) }, data: { simOptIn: true, simOptInAt: new Date(Date.now() - 10 * DAY) } });
  }
  const mayaPersona =
    "Maya believes sustainable packaging is expensive because of logistics, not materials, and that nobody has redesigned the logistics. She works best early, writes things down before she talks about them, and likes a small room with a clear owner for every decision. She's building toward coastal towns that earn from the sea without emptying it. She's strongest in operations and supplier relationships, and relies on others for brand, storytelling, software and fundraising. On hard calls she goes data first, then sleeps on it; when a partner disagrees she wants it said out loud, the same day, and would rather be wrong fast than right in a month.";
  await db.profile.update({ where: { userId: idOf("maya") }, data: { persona: mayaPersona, personaUpdatedAt: new Date(Date.now() - 12 * DAY) } });

  const simPeople = ["maya", "dev", "lena"];
  const simUsers = await db.user.findMany({ where: { id: { in: simPeople.map((k) => idOf(k)) } }, include: { profile: true } });
  const byKey = (k: string) => simUsers.find((u) => u.id === idOf(k))!;
  const personaOf = (k: string) => {
    const u = byKey(k);
    const pr = u.profile!;
    if (pr.persona) return pr.persona;
    const first = u.name.split(" ")[0];
    return [
      `${first}: ${pr.headline}.`,
      pr.beliefs && `Believes: ${pr.beliefs}`,
      pr.workStyle && `Works best: ${pr.workStyle}`,
      pr.buildingToward && `Building toward: ${pr.buildingToward}`,
      pr.strengths && `Strongest at: ${pr.strengths}`,
      pr.gaps && `Relies on others for: ${pr.gaps}`,
      pr.decisionStyle && `Hard calls and disagreement: ${pr.decisionStyle}`,
    ]
      .filter(Boolean)
      .join(" ");
  };
  const tide = await db.workspace.findUniqueOrThrow({ where: { slug: "tidewater-kelp" } });
  const lines: [string, string][] = [
    ["maya", "Before we file anything, I want us to agree the split in writing. I'd rather we have the awkward conversation today than a worse one in a year."],
    ["dev", "Agreed. My starting point is an even split with four-year vesting and a one-year cliff. Uneven splits on day one are usually where resentment starts."],
    ["lena", "Even feels fair for the three of us, but I've been in for two weeks and you two have been at this for months. I don't want to take credit for work I didn't do."],
    ["maya", "That's generous, Lena. The supplier relationships and the transport test were a lot of work, but most of the company doesn't exist yet. I care more that the next two years are fair."],
    ["dev", "Then vesting does the work. If one of us leaves early, they keep what they earned and nothing more. I'd resist a bigger founder share for the idea; ideas are cheap, the next two years aren't."],
    ["lena", "I can live with even if we also agree what happens when someone's time drops. I'm part-time for three more months, and I'd rather that was written down than assumed."],
    ["maya", "Yes. Let's write the part-time months down, and agree now what would make us revisit the split, so it isn't a surprise conversation later."],
    ["dev", "Fine by me. One thing I'm not settled on is whether the software IP sits with the company from day one. I'd say yes, but I want Harbor & Vine to check it."],
    ["lena", "So: even split, four-year vesting, my part-time months written down, a review date, and legal checks the IP. I'm comfortable with that, and I'd like us to say it back to each other in person."],
  ];
  const sim = await db.simulation.create({
    data: {
      createdById: idOf("maya"),
      workspaceId: tide.id,
      scenarioKey: "split-equity",
      scenarioTitle: "Split equity",
      scenarioBrief:
        "The founding team needs to agree how to split ownership before they formalise the company. Each has put in different amounts of time, money and ideas, and each has different plans for the next two years.",
      status: "DONE",
      maxTurns: lines.length,
      turnCount: lines.length,
      demo: false,
      createdAt: new Date(Date.now() - 3 * DAY),
      finishedAt: new Date(Date.now() - 3 * DAY + 600_000),
      participants: {
        create: simPeople.map((k, i) => ({ userId: idOf(k), order: i, personaSnapshot: personaOf(k), consentAt: new Date(Date.now() - 10 * DAY) })),
      },
    },
    include: { participants: true },
  });
  for (const [i, [who, text]] of lines.entries()) {
    const participant = sim.participants.find((p) => p.userId === idOf(who))!;
    await db.simulationTurn.create({ data: { simulationId: sim.id, index: i, participantId: participant.id, text } });
  }
  await db.fitReport.create({
    data: {
      simulationId: sim.id,
      aligned: [
        "In the simulation, all three wanted the split agreed in writing before filing, not after.",
        "Maya's and Dev's stand-ins both put more weight on the next two years than on who had the idea.",
        "Everyone accepted vesting as the way to keep an even split fair over time.",
      ],
      clashed: [
        "Lena's stand-in hesitated to take an equal share after two weeks, while Dev's pushed back on any founder premium.",
        "Dev's stand-in wasn't settled on where the software IP sits and wanted legal advice first.",
      ],
      talkAbout: [
        "Does an even split still feel fair to each of you once Lena's part-time months are written down?",
        "What would trigger a review of the split, and who can call it?",
        "Where should the software IP sit from day one, and what does Harbor & Vine say?",
        "How do each of you want to raise it if the split starts to feel unfair later?",
      ],
    },
  });
  console.log("Seeded 1 simulation.");
}
