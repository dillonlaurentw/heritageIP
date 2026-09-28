import type { ReactNode } from "react";

/** One quiet line, an optional hint, and an optional action. */
export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      {icon && <div className="mb-1 text-fg-subtle [&>svg]:size-6">{icon}</div>}
      <p className="text-base font-medium text-fg">{title}</p>
      {hint && <p className="max-w-sm text-sm text-fg-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
