/** Preset simulation scenarios. Edit freely; keys are stored on simulations. */
export type Scenario = { key: string; title: string; brief: string };

export const SCENARIOS: Scenario[] = [
  {
    key: "cut-mvp-scope",
    title: "Cut MVP scope",
    brief:
      "Launch is in six weeks and the build is running late. Half the planned features won't make it. The team has to decide together what to cut, what to keep, and what 'good enough' means for the first customers.",
  },
  {
    key: "investor-pass",
    title: "Respond to an investor pass",
    brief:
      "A backer the team was excited about just passed, saying the market looks too small. The team meets the same afternoon to decide what, if anything, to change, and how to reply.",
  },
  {
    key: "split-equity",
    title: "Split equity",
    brief:
      "The founding team needs to agree how to split ownership before they formalise the company. Each has put in different amounts of time, money and ideas, and each has different plans for the next two years.",
  },
  {
    key: "missed-deadline",
    title: "Handle a missed deadline",
    brief:
      "A promised delivery to the first paying customer slipped by two weeks, and the customer is unhappy. One teammate owned that deadline. The team meets to decide what to tell the customer and what changes internally.",
  },
  {
    key: "pivot-or-persevere",
    title: "Pivot or persevere",
    brief:
      "Three months of customer conversations show interest but few people paying. One teammate wants to change the customer; another wants to keep going. The team has one meeting to decide the next quarter.",
  },
];

export const scenarioByKey = (key: string) => SCENARIOS.find((s) => s.key === key) ?? null;
