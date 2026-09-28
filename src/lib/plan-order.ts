/**
 * Pure ordering logic for game-plan steps (no database), so it can be unit
 * tested. Steps are ordered by stage, then position within the stage.
 */
export const STAGES = ["VALIDATE", "SETUP", "BUILD", "LAUNCH"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_COPY: Record<Stage, { label: string; line: string }> = {
  VALIDATE: { label: "Validate", line: "Prove the problem and the customer." },
  SETUP: { label: "Set up", line: "Company, team, money, paperwork." },
  BUILD: { label: "Build", line: "Make the first real version." },
  LAUNCH: { label: "Launch", line: "Put it in front of customers." },
};

export type Ordered = { id: string; stage: Stage; position: number };

export function sortSteps<T extends Ordered>(steps: T[]): T[] {
  return [...steps].sort(
    (a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || a.position - b.position,
  );
}

/** Renumber positions 0..n within each stage. */
export function normalize<T extends Ordered>(steps: T[]): T[] {
  const counters = new Map<Stage, number>();
  return sortSteps(steps).map((s) => {
    const n = counters.get(s.stage) ?? 0;
    counters.set(s.stage, n + 1);
    return { ...s, position: n };
  });
}

/**
 * Move a step one place up or down. At the edge of its stage it crosses into
 * the neighbouring stage (landing at that stage's near end). At the very
 * first/last position overall, nothing changes.
 */
export function move<T extends Ordered>(steps: T[], id: string, dir: "up" | "down"): T[] {
  const list = normalize(steps);
  const i = list.findIndex((s) => s.id === id);
  if (i === -1) return list;
  const step = list[i];
  const stageSteps = list.filter((s) => s.stage === step.stage);
  const atEdge = dir === "up" ? step.position === 0 : step.position === stageSteps.length - 1;

  if (!atEdge) {
    const j = dir === "up" ? i - 1 : i + 1;
    const other = list[j];
    const next = [...list];
    next[i] = { ...step, position: other.position };
    next[j] = { ...other, position: step.position };
    return normalize(next);
  }

  const si = STAGES.indexOf(step.stage) + (dir === "up" ? -1 : 1);
  if (si < 0 || si >= STAGES.length) return list;
  const target = STAGES[si];
  const moved = { ...step, stage: target, position: dir === "up" ? Number.MAX_SAFE_INTEGER : -1 };
  return normalize(list.map((s) => (s.id === id ? moved : s)));
}

/** "STEP 4/11"-style progress. */
export function progress(steps: { doneAt: Date | string | null }[]) {
  return { done: steps.filter((s) => s.doneAt).length, total: steps.length };
}
