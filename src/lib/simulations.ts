import "server-only";
import { defaultPersona, fitReportAgent, runAgent, simulationTurnAgent } from "@/agents";
import { agentsLive } from "@/agents/config";
import type { BuilderContext } from "@/agents/context";
import { db } from "./db";
import { sendEmail } from "./email";
import { scenarioByKey } from "./scenarios";
import type { Viewer } from "./session";
import { checkParticipants, shouldStop, SIM_LIMITS, speakerIndex } from "./simulation-rules";

const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

type ProfileLike = {
  headline: string | null;
  beliefs: string | null;
  workStyle: string | null;
  buildingToward: string | null;
  strengths: string | null;
  gaps: string | null;
  decisionStyle: string | null;
  persona: string | null;
};

/** Exactly what someone's personal agent is given: their saved persona, or a plain restatement of their answers. */
export function personaText(name: string, p: ProfileLike) {
  if (p.persona?.trim()) return p.persona.trim();
  const b: BuilderContext = { name, ...p };
  return defaultPersona(b);
}

export type EligiblePerson = { id: string; name: string; headline: string | null; optedIn: boolean; context: string[] };

/**
 * People the viewer may simulate with: teammates on shared hubs, candidates
 * who signalled interest in the viewer's roles, and anyone they're connected
 * to. Only opted-in people can actually be picked.
 */
export async function eligiblePeople(viewerId: string): Promise<EligiblePerson[]> {
  const ctx = new Map<string, Set<string>>();
  const add = (id: string, label: string) => {
    if (id === viewerId) return;
    if (!ctx.has(id)) ctx.set(id, new Set());
    ctx.get(id)!.add(label);
  };

  const [owned, joined, roleSignals, connected] = await Promise.all([
    db.hub.findMany({ where: { ownerId: viewerId }, select: { name: true, members: { select: { userId: true } } } }),
    db.hub.findMany({
      where: { members: { some: { userId: viewerId } } },
      select: { name: true, ownerId: true, members: { select: { userId: true } } },
    }),
    db.signal.findMany({
      where: { kind: "ROLE_INTEREST", toUserId: viewerId, status: { in: ["PENDING", "ACCEPTED"] } },
      select: { fromUserId: true, roleOpening: { select: { title: true } } },
    }),
    db.signal.findMany({
      where: { status: "ACCEPTED", OR: [{ fromUserId: viewerId }, { toUserId: viewerId }] },
      select: { fromUserId: true, toUserId: true },
    }),
  ]);
  for (const h of owned) for (const m of h.members) add(m.userId, `Team · ${h.name}`);
  for (const h of joined) {
    add(h.ownerId, `Team · ${h.name}`);
    for (const m of h.members) add(m.userId, `Team · ${h.name}`);
  }
  for (const s of roleSignals) add(s.fromUserId, `Candidate · ${s.roleOpening?.title ?? "Role"}`);
  for (const s of connected) add(s.fromUserId === viewerId ? s.toUserId : s.fromUserId, "Connected");

  const users = await db.user.findMany({
    where: { id: { in: [...ctx.keys()] } },
    select: { id: true, name: true, profile: { select: { headline: true, simOptIn: true } } },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    headline: u.profile?.headline ?? null,
    optedIn: Boolean(u.profile?.simOptIn),
    context: [...(ctx.get(u.id) ?? [])].sort((a, b) => Number(b.startsWith("Team")) - Number(a.startsWith("Team"))),
  }));
}

export async function simsStartedToday(userId: string) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  return db.simulation.count({ where: { createdById: userId, createdAt: { gte: since } } });
}

export async function startSimulation(
  viewer: Viewer,
  input: { participantIds: string[]; scenarioKey: string; customTitle?: string; customBrief?: string; hubId: string | null; maxTurns: number },
) {
  if (!(SIM_LIMITS.turnOptions as readonly number[]).includes(input.maxTurns)) return { ok: false as const, message: "Pick a length." };
  if ((await simsStartedToday(viewer.user.id)) >= SIM_LIMITS.perUserPerDay) {
    return { ok: false as const, message: `That's ${SIM_LIMITS.perUserPerDay} simulations today. More tomorrow.` };
  }

  const scenario =
    input.scenarioKey === "custom"
      ? input.customTitle?.trim() && input.customBrief?.trim()
        ? { key: "custom", title: input.customTitle.trim(), brief: input.customBrief.trim() }
        : null
      : scenarioByKey(input.scenarioKey);
  if (!scenario) return { ok: false as const, message: "Pick a scenario, or describe your own." };

  const ids = [...new Set([viewer.user.id, ...input.participantIds])];
  const eligible = await eligiblePeople(viewer.user.id);
  const people = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, profile: true } });
  const problem = checkParticipants({
    initiatorId: viewer.user.id,
    participantIds: ids,
    optedIn: new Set(people.filter((p) => p.profile?.simOptIn).map((p) => p.id)),
    eligible: new Set(eligible.map((e) => e.id)),
  });
  if (problem) return { ok: false as const, message: problem };

  const hub = input.hubId
    ? await db.hub.findFirst({
        where: { id: input.hubId, OR: [{ ownerId: viewer.user.id }, { members: { some: { userId: viewer.user.id } } }] },
      })
    : null;

  // Speaking order: initiator first, then as picked.
  const ordered = ids.map((id) => people.find((p) => p.id === id)!);
  const sim = await db.simulation.create({
    data: {
      createdById: viewer.user.id,
      hubId: hub?.id ?? null,
      scenarioKey: scenario.key,
      scenarioTitle: scenario.title,
      scenarioBrief: scenario.brief,
      maxTurns: input.maxTurns,
      demo: !agentsLive(),
      participants: {
        create: ordered.map((p, i) => ({
          userId: p.id,
          order: i,
          personaSnapshot: personaText(p.name, p.profile!),
          consentAt: p.profile!.simOptInAt ?? new Date(),
        })),
      },
    },
  });
  return { ok: true as const, id: sim.id };
}

async function loadSim(simId: string) {
  return db.simulation.findUnique({
    where: { id: simId },
    include: {
      hub: { select: { name: true, thesis: { select: { statement: true } } } },
      participants: { orderBy: { order: "asc" }, include: { user: { select: { id: true, name: true, email: true, profile: { select: { simOptIn: true } } } } } },
      turns: { orderBy: { index: "asc" }, include: { participant: { include: { user: { select: { name: true } } } } } },
    },
  });
}

export async function isParticipant(simId: string, userId: string) {
  return Boolean(await db.simulationParticipant.findUnique({ where: { simulationId_userId: { simulationId: simId, userId } } }));
}

export type TurnView = { index: number; speakerId: string; speaker: string; text: string };

/**
 * Advance a running simulation by one turn. Only its initiator drives it.
 * Consent is re-checked every turn: if anyone has opted out, it stops.
 */
export async function runNextTurn(simId: string, viewer: Viewer) {
  const sim = await loadSim(simId);
  if (!sim || sim.createdById !== viewer.user.id) return { ok: false as const, message: "Not your simulation." };
  if (sim.status !== "RUNNING") return { ok: true as const, done: true, turn: null };

  const withdrawn = sim.participants.find((p) => !p.user.profile?.simOptIn);
  if (withdrawn) {
    await db.simulation.update({
      where: { id: sim.id },
      data: { status: "CANCELLED", finishedAt: new Date(), cancelReason: `${withdrawn.user.name.split(" ")[0]} turned off simulations for their agent.` },
    });
    return { ok: false as const, message: "Someone in this simulation turned off their agent's opt-in, so it has stopped." };
  }
  if (sim.turnCount >= sim.maxTurns) return { ok: true as const, done: true, turn: null };

  // Demo agents answer instantly; a short beat keeps the live view readable.
  if (sim.demo) await new Promise((r) => setTimeout(r, 900));

  const people = sim.participants.map((p) => ({ name: p.user.name, persona: p.personaSnapshot }));
  const index = sim.turnCount;
  const si = speakerIndex(index, people.length);
  const res = await runAgent(
    simulationTurnAgent,
    {
      scenarioTitle: sim.scenarioTitle,
      scenarioBrief: sim.scenarioBrief,
      hubContext: sim.hub ? `${sim.hub.name}${sim.hub.thesis ? `: ${sim.hub.thesis.statement}` : ""}` : null,
      people,
      speaker: si,
      transcript: sim.turns.map((t) => ({ speaker: t.participant.user.name, text: t.text })),
      turn: index + 1,
      maxTurns: sim.maxTurns,
    },
    { userId: viewer.user.id, hubId: null },
  );
  if (!res.ok) return { ok: false as const, message: res.message };

  const speaker = sim.participants[si];
  try {
    await db.$transaction([
      db.simulationTurn.create({ data: { simulationId: sim.id, index, participantId: speaker.id, text: res.output.text.trim() } }),
      db.simulation.update({ where: { id: sim.id }, data: { turnCount: index + 1 } }),
    ]);
  } catch {
    // Another tab already wrote this turn. Nothing to do.
    return { ok: true as const, done: false, turn: null };
  }
  const done = shouldStop(index + 1, sim.maxTurns, people.length, res.output.wantsToEnd);
  if (done && index + 1 < sim.maxTurns) await db.simulation.update({ where: { id: sim.id }, data: { maxTurns: index + 1 } });
  return {
    ok: true as const,
    done,
    turn: { index, speakerId: speaker.user.id, speaker: speaker.user.name, text: res.output.text.trim() } satisfies TurnView,
  };
}

/** Write the fit report and close the simulation. Participants get an email. */
export async function finishSimulation(simId: string, viewer: Viewer) {
  const sim = await loadSim(simId);
  if (!sim || sim.createdById !== viewer.user.id) return { ok: false as const, message: "Not your simulation." };
  // A simulation stopped because someone withdrew consent never gets a report.
  if (sim.status === "CANCELLED") return { ok: false as const, message: "This simulation was stopped, so there's no report." };
  const existing = await db.fitReport.findUnique({ where: { simulationId: sim.id } });
  if (existing) return { ok: true as const };
  if (sim.turns.length < sim.participants.length) return { ok: false as const, message: "Let everyone speak at least once first." };

  const res = await runAgent(
    fitReportAgent,
    {
      scenarioTitle: sim.scenarioTitle,
      people: sim.participants.map((p) => ({ name: p.user.name, persona: p.personaSnapshot })),
      transcript: sim.turns.map((t) => ({ speaker: t.participant.user.name, text: t.text })),
    },
    { userId: viewer.user.id, hubId: null },
  );
  if (!res.ok) return { ok: false as const, message: res.message };

  await db.$transaction([
    db.fitReport.create({ data: { simulationId: sim.id, ...res.output } }),
    db.simulation.update({
      where: { id: sim.id },
      data: { status: sim.status === "RUNNING" ? "DONE" : sim.status, finishedAt: new Date(), maxTurns: Math.max(sim.turns.length, 1) },
    }),
  ]);
  const others = sim.participants.filter((p) => p.user.id !== viewer.user.id);
  await Promise.all(
    others.map((p) =>
      sendEmail({
        to: p.user.email,
        subject: `Your agent took part in a simulation: ${sim.scenarioTitle}`,
        text: `${viewer.user.name} ran a SIMULATION ("${sim.scenarioTitle}") that included your personal agent, with your opt-in.\n\nIt's an AI stand-in built from the persona you approved, not you. Read the transcript and the conversation starters: ${appUrl()}/simulations/${sim.id}\n\nYou can turn simulations off any time: ${appUrl()}/me/agent`,
      }),
    ),
  );
  return { ok: true as const };
}
