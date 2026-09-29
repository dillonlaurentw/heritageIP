import { z } from "zod";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type SimPerson = { name: string; persona: string };

export type SimTurnCtx = {
  scenarioTitle: string;
  scenarioBrief: string;
  companyContext: string | null; // e.g. "Tidewater Kelp: <thesis statement>"
  people: SimPerson[];
  speaker: number; // index into people
  transcript: { speaker: string; text: string }[];
  turn: number; // 1-based
  maxTurns: number;
};

const SIM_RULES = `This is a SIMULATION. You voice an AI stand-in for a real person, built only
from the persona they wrote and approved. Rules:
- Speak as that person would, grounded ONLY in their persona. Never invent
  history, credentials, money, relationships or facts not in the persona or
  the scenario.
- Be realistic: people disagree, hedge, change their minds, and care about
  different things. Don't force agreement; don't manufacture conflict either.
- Stay respectful. No insults, no pressure tactics, nothing you wouldn't want
  the real person to read about themselves.
- Speak in first person, naturally, 1 to 4 sentences. No stage directions,
  no names as prefixes, no lists.`;

function cast(people: SimPerson[]) {
  return people.map((p) => `${p.name}\nPersona: ${p.persona}`).join("\n\n");
}

/** One turn of a team simulation, voiced as one participant. */
export const simulationTurnAgent = defineAgent({
  purpose: "sim.turn",
  effort: "low",
  schema: z.object({
    text: z.string().describe("What this person says, 1-4 sentences, first person"),
    wantsToEnd: z.boolean().describe("True only if the group has reached a clear decision or a clear impasse"),
  }),
  system: () => `${SELF_VOICE}\n\n${SIM_RULES}`,
  prompt: (ctx: SimTurnCtx) => {
    const speaker = ctx.people[ctx.speaker];
    const soFar = ctx.transcript.length
      ? ctx.transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n")
      : "(Nobody has spoken yet. Open the conversation.)";
    const closing =
      ctx.turn >= ctx.maxTurns - 1 ? "\nThe meeting is nearly over: move toward a decision or name what's unresolved." : "";
    return `Scenario: ${ctx.scenarioTitle}
${ctx.scenarioBrief}
${ctx.companyContext ? `\nContext: ${ctx.companyContext}\n` : ""}
The people in the room:

${cast(ctx.people)}

Conversation so far:
${soFar}

It is turn ${ctx.turn} of at most ${ctx.maxTurns}. You are ${speaker.name}.${closing}
Say what ${speaker.name.split(" ")[0]} would say next.`;
  },
  demo: (ctx) => {
    const other = ctx.people[(ctx.speaker + 1) % ctx.people.length].name.split(" ")[0];
    const lines = [
      "Before we decide anything, I want us each to say what we're most worried about. For me it's that we rush this and resent it later.",
      `I hear that, ${other}. I care more about moving this week than getting it perfect. What would you need to see to feel okay with a first version?`,
      "Can we write down the two or three things none of us is willing to give up? If we agree on those, the rest is negotiable.",
      "Honestly, I'd rather disagree now than be polite and regret it. My view is we keep it simple and revisit in three months.",
      "That works for me if we set a date to revisit it and write down what would make us change our minds.",
      "I'm not fully convinced, but I can live with it. Let's be clear about who owns what from tomorrow.",
    ];
    return {
      text: lines[(ctx.turn - 1) % lines.length],
      wantsToEnd: ctx.turn >= Math.max(6, ctx.people.length * 2),
    };
  },
});

/** The fit report: a conversation starter, never a verdict or score. */
export const fitReportAgent = defineAgent({
  purpose: "sim.report",
  effort: "medium",
  schema: z.object({
    aligned: z.array(z.string()).describe("2-4 places the stand-ins agreed or complemented each other"),
    clashed: z.array(z.string()).describe("2-4 places they pulled in different directions, described neutrally"),
    talkAbout: z.array(z.string()).describe("3-5 open questions the REAL people should discuss together"),
  }),
  system: () => `${SELF_VOICE}

You write a short fit report after a team SIMULATION between AI stand-ins.
It is a conversation starter for the real people, never a verdict on them.
- Never score, rate, rank, grade or recommend for or against anyone.
- Never say who is "right", "better", "a good fit" or "a bad fit".
- Describe patterns in what the stand-ins said, attributing to names neutrally.
- Phrase points as "in the simulation", and turn tensions into questions for
  the real people.
- Each point is one sentence.`,
  prompt: (ctx: { scenarioTitle: string; people: SimPerson[]; transcript: { speaker: string; text: string }[] }) => `Scenario: ${ctx.scenarioTitle}

People (stand-ins): ${ctx.people.map((p) => p.name).join(", ")}

Transcript:
${ctx.transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n")}

Write the fit report.`,
  demo: (ctx) => {
    const [a, b, c] = ctx.people.map((p) => p.name.split(" ")[0]);
    return {
      aligned: [
        "In the simulation, everyone wanted to name the non-negotiables before debating details.",
        `${a} and ${b} both agreed to revisit the decision on a set date rather than treat it as final.`,
      ],
      clashed: [
        `${b}'s stand-in pushed to move this week, while ${a}'s wanted to slow down to avoid resentment later.`,
        c
          ? `${c}'s stand-in went along with the decision but said they weren't fully convinced.`
          : "They agreed on process but never settled who owns what from tomorrow.",
      ],
      talkAbout: [
        "What are the two or three things each of you won't give up here, and why?",
        "What would make you change your mind in three months, and who calls the review?",
        "How do you each like to disagree: in the room, in writing, or after sleeping on it?",
        "Who owns the next step, and what does done look like by Friday?",
      ],
    };
  },
});
