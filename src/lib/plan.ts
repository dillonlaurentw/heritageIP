import "server-only";
import { db } from "./db";
import { sortSteps, type Stage } from "./plan-order";
import type { Need } from "./needs";

/** What the client sees of a step. */
export type StepView = {
  id: string;
  stage: Stage;
  position: number;
  title: string;
  detail: string | null;
  needs: Need[];
  done: boolean;
  source: "AGENT" | "MANUAL";
};

export async function listSteps(hubId: string): Promise<StepView[]> {
  const rows = await db.planStep.findMany({ where: { hubId } });
  return sortSteps(rows).map((s) => ({
    id: s.id,
    stage: s.stage,
    position: s.position,
    title: s.title,
    detail: s.detail,
    needs: s.needs,
    done: Boolean(s.doneAt),
    source: s.source,
  }));
}
