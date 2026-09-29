import { Check } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/cn";

/** On a goal's page: the tasks linked to it, and how far along they are. */
export function GoalTasks({ tasks, tasksHref }: { tasks: { id: string; title: string; done: boolean; href: string }[]; tasksHref: string | null }) {
  const done = tasks.filter((t) => t.done).length;
  return (
    <section className="mb-4 rounded-lg bg-bg-subtle p-3">
      <div className="mb-1 flex items-center gap-3">
        <p className="text-xs font-medium text-fg-subtle">Progress, from linked tasks</p>
        {tasks.length > 0 && <Progress done={done} total={tasks.length} />}
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No tasks linked yet. Set a task&apos;s <span className="font-medium text-fg">Goal</span> to this goal
          {tasksHref ? (
            <>
              {" "}in{" "}
              <Link href={tasksHref as Route} className="text-fg underline underline-offset-2">
                Tasks
              </Link>
            </>
          ) : null}
          .
        </p>
      ) : (
        <ul className="flex flex-col">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link href={t.href as Route} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-bg-hover">
                <span className={cn("flex size-3.5 items-center justify-center rounded-sm border", t.done ? "border-primary bg-primary text-primary-fg" : "border-border-strong")}>
                  {t.done && <Check className="size-2.5" />}
                </span>
                <span className={cn("truncate", t.done && "text-fg-muted line-through")}>{t.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
