import { cn } from "@/lib/cn";

/** A thin progress bar with "3/5". For goals and plan progress. */
export function Progress({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-fg-muted", className)} title={`${done} of ${total} linked tasks done`}>
      <span className="h-1 w-16 overflow-hidden rounded-full bg-bg-active">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
}
