/**
 * The template gallery. Page templates are plain block lists; "flow" templates
 * open a guided screen (thesis, game plan); database templates create a
 * built-in database. Pure data, shared by server and seed.
 */
import { B } from "./blocks";
import type { SystemKey } from "./system-dbs";

export type Template =
  | { key: string; kind: "page"; title: string; icon: string; blurb: string; group: TemplateGroup; blocks: () => unknown[]; systemKey?: string }
  | { key: string; kind: "flow"; title: string; icon: string; blurb: string; group: TemplateGroup; path: "thesis" | "plan" }
  | { key: string; kind: "database"; title: string; icon: string; blurb: string; group: TemplateGroup; db: SystemKey };

export type TemplateGroup = "Think" | "Plan" | "Run" | "Team";

const guide = (q: string) => B.p(q);

export const TEMPLATES: Template[] = [
  { key: "thesis", kind: "flow", path: "thesis", group: "Think", title: "Thesis", icon: "💡", blurb: "SELF asks the hard questions, then drafts the core thesis with you." },
  { key: "gamePlan", kind: "flow", path: "plan", group: "Plan", title: "Game plan", icon: "🧭", blurb: "Staged steps from idea to launch, each tagged with who you need." },
  {
    key: "gtm",
    kind: "page",
    systemKey: "gtm",
    group: "Plan",
    title: "Go-to-market",
    icon: "📣",
    blurb: "Positioning, target customers, channels and the launch plan.",
    blocks: () => [
      B.p("How this gets in front of the first customers. Keep each section short; sharpen it with Ask AI when you're stuck."),
      B.h2("Positioning"),
      guide("For [who], [name] is the [category] that [key benefit], unlike [alternative]."),
      B.h2("Target customers"),
      guide("The first twenty: who they are, where they are, and how you'll reach them this month."),
      B.h2("Channels"),
      guide("Two or three channels you can actually run, and what a good week looks like in each."),
      B.h2("Launch plan"),
      B.todo("Pick the launch date"),
      B.todo("Line up the first ten conversations"),
      B.todo("Write the one-page story"),
    ],
  },
  {
    key: "pitch",
    kind: "page",
    group: "Plan",
    title: "Pitch narrative",
    icon: "🎤",
    blurb: "The story you tell backers and partners. Practice material, not an offering.",
    blocks: () => [
      B.p("The story, in the order you'd tell it. This is for practice and conversations; SELF never drafts offering documents or terms."),
      B.h2("In five lines"),
      B.number("The problem, as a customer would say it"),
      B.number("What you do about it"),
      B.number("Why now"),
      B.number("Why you"),
      B.number("What help you're looking for"),
      B.h2("Proof so far"),
      guide("Customers, pilots, letters of intent, numbers that moved."),
      B.h2("Questions you'll get"),
      B.bullet("What happens if a bigger company copies this?"),
      B.bullet("What would have to be true for this to fail?"),
    ],
  },
  {
    key: "weekly",
    kind: "page",
    group: "Run",
    title: "Weekly update",
    icon: "🗒️",
    blurb: "What happened, what's next, what's stuck. For the team or your backers.",
    blocks: () => [
      B.h2("What we did"),
      B.bullet(""),
      B.h2("What's next"),
      B.bullet(""),
      B.h2("Blockers"),
      guide("Where you need help, and from whom."),
      B.h2("Numbers"),
      guide("The two or three numbers that matter this month."),
    ],
  },
  {
    key: "interview",
    kind: "page",
    group: "Think",
    title: "Customer interview",
    icon: "🎙️",
    blurb: "Notes from a conversation with a customer: their words, not yours.",
    blocks: () => [
      B.labeled("Who:", ""),
      B.labeled("Date:", ""),
      B.h2("How they do it today"),
      guide("Walk through the last time the problem came up."),
      B.h2("What they said"),
      B.quote(""),
      B.h2("What surprised us"),
      B.bullet(""),
      B.h2("Follow-ups"),
      B.todo(""),
    ],
  },
  {
    key: "decision",
    kind: "page",
    group: "Team",
    title: "Decision record",
    icon: "⚖️",
    blurb: "One decision, why it was made, and who owns it. So nobody re-argues it.",
    blocks: () => [
      B.labeled("Decision:", ""),
      B.labeled("Owner:", ""),
      B.labeled("Date:", ""),
      B.h2("Context"),
      guide("What forced the decision now."),
      B.h2("Options we considered"),
      B.bullet(""),
      B.h2("Why this one"),
      guide("And what would make us change our minds."),
    ],
  },
  {
    key: "brief",
    kind: "page",
    group: "Run",
    title: "Project brief",
    icon: "📌",
    blurb: "Goal, scope, risks and milestones for one piece of work.",
    blocks: () => [
      B.h2("Goal"),
      guide("What done looks like, in one sentence."),
      B.h2("Why now"),
      B.h2("In scope"),
      B.bullet(""),
      B.h2("Out of scope"),
      B.bullet(""),
      B.h2("Risks"),
      B.bullet(""),
      B.h2("Milestones"),
      B.todo(""),
    ],
  },
  { key: "tasks", kind: "database", db: "tasks", group: "Run", title: "Tasks", icon: "✅", blurb: "Who's doing what, by when. Board, list and calendar views." },
  { key: "meetings", kind: "database", db: "meetings", group: "Team", title: "Meetings", icon: "🗓️", blurb: "Every meeting's notes; action items become tasks." },
  { key: "goals", kind: "database", db: "goals", group: "Plan", title: "Goals", icon: "🎯", blurb: "What you're aiming for, with progress from linked tasks." },
  { key: "roles", kind: "database", db: "roles", group: "Team", title: "Roles", icon: "🤝", blurb: "Co-founders and teammates you're looking for; post them to the Network." },
  { key: "crm", kind: "database", db: "crm", group: "Run", title: "Customers & suppliers", icon: "📇", blurb: "Everyone you sell to or buy from, and the next step with each." },
];

export const templateByKey = (key: string) => TEMPLATES.find((t) => t.key === key) ?? null;
