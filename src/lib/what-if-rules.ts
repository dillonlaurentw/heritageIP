/** Business what-ifs: pure helpers, tested in __tests__/what-if-rules.test.ts. */

/** Starting points for a what-if, from the plan itself. Never more than four. */
export function whatIfIdeas(steps: { title: string; needs: string[]; done: boolean }[]): string[] {
  const open = steps.filter((s) => !s.done);
  const partnerStep = open.find((s) => s.needs.some((n) => ["SUPPLIER", "LEGAL", "DESIGN", "WEBSITE"].includes(n)));
  const ideas = [
    partnerStep ? `“${partnerStep.title}” takes twice as long` : null,
    "The first customer says no",
    open.some((s) => s.needs.includes("COFOUNDER")) ? "The co-founder you want can only give three days a week" : "A co-founder goes part-time for three months",
    "A buyer asks for ten times the volume",
  ];
  return ideas.filter((x): x is string => !!x).slice(0, 4);
}

/** Resolves the agent's step numbers to real steps, dropping any number that isn't in the list. */
export function resolveSlips<T extends { n: number; id: string; title: string }>(steps: T[], slips: { step: number; effect: string }[]) {
  const byN = new Map(steps.map((s) => [s.n, s]));
  const seen = new Set<number>();
  return slips.flatMap((s) => {
    const step = byN.get(s.step);
    if (!step || seen.has(s.step)) return [];
    seen.add(s.step);
    return [{ stepId: step.id, title: step.title, effect: s.effect }];
  });
}

/** Which suggested changes may still be added: valid indexes, not added before. */
export function changesToApply(total: number, applied: number[], picked: number[]) {
  const done = new Set(applied);
  return [...new Set(picked)].filter((i) => Number.isInteger(i) && i >= 0 && i < total && !done.has(i)).sort((a, b) => a - b);
}
