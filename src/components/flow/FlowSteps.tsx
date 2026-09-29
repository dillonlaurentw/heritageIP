import { Fragment } from "react";
import { cn } from "@/lib/cn";

export const FLOW = ["Idea", "Questions", "Thesis", "Plan"] as const;
export type FlowStep = (typeof FLOW)[number];

/** Idea — Questions — Thesis — Plan: where you are on the way from a thought to a plan. */
export function FlowSteps({ current, className }: { current: FlowStep; className?: string }) {
  const at = FLOW.indexOf(current);
  return (
    <ol aria-label="From idea to plan" className={cn("flex items-center gap-3 text-sm", className)}>
      {FLOW.map((s, i) => (
        <Fragment key={s}>
          {i > 0 && <li aria-hidden className="h-px w-6 bg-border-strong" />}
          <li aria-current={i === at ? "step" : undefined} className={cn(i === at ? "font-medium text-fg" : i < at ? "text-fg-muted" : "text-fg-subtle")}>
            {s}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
