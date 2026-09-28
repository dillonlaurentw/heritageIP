/** The four GTM workspace sections (shared client + server + agent). */
export const GTM_SECTIONS = ["positioning", "customers", "channels", "launchPlan"] as const;
export type GtmSection = (typeof GTM_SECTIONS)[number];

export const GTM_COPY: Record<GtmSection, { label: string; line: string; placeholder: string; guide: string }> = {
  positioning: {
    label: "Positioning",
    line: "Who it's for, what it replaces, and why it's different. In one breath.",
    placeholder: "For [who] who [need], [name] is a [category] that [benefit]. Unlike [alternative], it [difference].",
    guide:
      "Write a positioning statement in the form 'For [who] who [need], [name] is a [category] that [benefit]. Unlike [alternative], it [difference].' Then a one-line tagline on its own line, starting 'Tagline:'. Then 2-3 short proof points starting with '- '.",
  },
  customers: {
    label: "Target customers",
    line: "The first people who'll pay, where to find them, and what makes them look for a fix.",
    placeholder: "Segment, where they are, the trigger that makes them look for this…",
    guide:
      "Describe 2-3 customer segments, most important first. For each: a heading line with the segment name, then '- Who:', '- Where to find them:', '- Trigger:' (the moment they start looking), '- First 20:' (how to reach the first twenty).",
  },
  channels: {
    label: "Channels",
    line: "Where you'll reach them, ranked, each with a cheap first test.",
    placeholder: "1. Channel · why it fits · first test this month",
    guide:
      "List 3-5 channels, ranked by expected payoff for the first 20 customers. For each, one line: 'N. Channel · why it fits · first test (with a number to hit)'. Prefer direct, unglamorous channels early.",
  },
  launchPlan: {
    label: "Launch plan",
    line: "What happens before, during and after launch, week by week.",
    placeholder: "Weeks −4 to −1 · Launch week · Weeks +1 to +4",
    guide:
      "Write a launch plan in three blocks with these headings on their own lines: 'Before (weeks -4 to -1)', 'Launch week', 'After (weeks +1 to +4)'. Under each, 3-5 concrete actions starting with '- ', each with an owner or a number where possible.",
  },
};
