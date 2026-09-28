import "server-only";
import { db } from "@/lib/db";
import { NEEDS, type Need } from "@/lib/needs";
import { sortSteps, STAGE_COPY } from "@/lib/plan-order";
import { GTM_COPY, GTM_SECTIONS } from "@/lib/gtm-sections";

/**
 * Everything a hub agent knows about the business, as plain text. It's the
 * same for every message in a conversation, so it sits in the cached part of
 * the prompt.
 */
export async function hubBriefing(hubId: string) {
  const hub = await db.hub.findUniqueOrThrow({
    where: { id: hubId },
    include: {
      thesis: true,
      gtmWorkspace: true,
      owner: { select: { name: true, profile: { select: { headline: true, strengths: true, gaps: true } } } },
      members: { select: { role: true, user: { select: { name: true } } } },
      planSteps: true,
      roleOpenings: { where: { status: "OPEN" }, select: { title: true, commitment: true } },
      signals: {
        where: { kind: "PARTNER_INTRO", status: { in: ["PENDING", "ACCEPTED"] } },
        select: { status: true, partner: { select: { name: true } } },
      },
    },
  });
  const t = hub.thesis;
  const steps = sortSteps(hub.planSteps);
  const done = steps.filter((s) => s.doneAt).length;
  const lines: (string | null)[] = [
    `HUB: ${hub.name}${hub.oneLiner ? ` (${hub.oneLiner})` : ""}. Stage: ${hub.stage.toLowerCase()}.`,
    `Raw idea: ${hub.rawIdea}`,
    t
      ? [
          "THESIS",
          `Statement: ${t.statement}`,
          `Problem: ${t.problem}`,
          `Who it's for: ${t.audience}`,
          `Why now: ${t.whyNow}`,
          `Why this team: ${t.whyUs}`,
          `Contrarian belief: ${t.contrarian}`,
          t.openQuestions.length ? `Still open: ${t.openQuestions.join(" / ")}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "THESIS: not written yet.",
    steps.length
      ? `GAME PLAN (${done}/${steps.length} done)\n` +
        steps
          .map(
            (s) =>
              `- [${s.doneAt ? "x" : " "}] ${STAGE_COPY[s.stage].label}: ${s.title}${s.needs.length ? ` (needs: ${s.needs.map((n) => NEEDS[n as Need].label).join(", ")})` : ""}`,
          )
          .join("\n")
      : "GAME PLAN: none yet.",
    `TEAM: ${hub.owner.name} (founder${hub.owner.profile?.headline ? `, ${hub.owner.profile.headline}` : ""})` +
      hub.members.map((m) => `; ${m.user.name} (${m.role})`).join(""),
    hub.owner.profile?.strengths ? `Founder strengths: ${hub.owner.profile.strengths}` : null,
    hub.owner.profile?.gaps ? `Founder relies on others for: ${hub.owner.profile.gaps}` : null,
    hub.roleOpenings.length ? `OPEN ROLES: ${hub.roleOpenings.map((r) => `${r.title} (${r.commitment})`).join("; ")}` : null,
    hub.signals.length
      ? `PARTNER INTROS: ${hub.signals.map((s) => `${s.partner?.name} (${s.status.toLowerCase()})`).join("; ")}`
      : null,
    GTM_SECTIONS.some((k) => hub.gtmWorkspace?.[k]?.trim())
      ? "GO-TO-MARKET WORKSPACE\n" +
        GTM_SECTIONS.filter((k) => hub.gtmWorkspace?.[k]?.trim())
          .map((k) => `${GTM_COPY[k].label}:\n${hub.gtmWorkspace![k]!.trim()}`)
          .join("\n\n")
      : null,
  ];
  return lines.filter(Boolean).join("\n\n");
}
