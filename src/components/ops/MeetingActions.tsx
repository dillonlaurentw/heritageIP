"use client";

import { Check, ListChecks } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { sendMeetingActionsAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

type LinkedTask = { id: string; title: string; done: boolean; href: string };

/** Under a meeting note: send its unchecked to-dos to Tasks, and see what already went. */
export function MeetingActions({ meetingId, tasks, editable }: { meetingId: string; tasks: LinkedTask[]; editable: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();

  const send = () =>
    start(async () => {
      // Let the editor's autosave land first, so the latest to-dos count.
      await new Promise((r) => setTimeout(r, 900));
      const res = await sendMeetingActionsAction(meetingId);
      if (!res.ok) return toast(res.message, "danger");
      if (res.sent === 0) toast(res.total === 0 ? "No open to-dos here. Add some with [ ] or /todo." : "Everything here is already in Tasks.");
      else toast(`${res.sent} ${res.sent === 1 ? "action item" : "action items"} sent to Tasks`);
      router.refresh();
    });

  return (
    <section className="mt-10 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ListChecks className="size-4 text-fg-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Action items</p>
          <p className="text-xs text-fg-muted">Unchecked to-dos become tasks, linked to this meeting. @mention someone in a to-do to assign it.</p>
        </div>
        {editable && (
          <Button variant="primary" size="sm" onClick={send} disabled={busy}>
            {busy ? "Sending…" : "Send to Tasks"}
          </Button>
        )}
      </div>
      {tasks.length > 0 && (
        <ul className="mt-3 flex flex-col border-t border-border pt-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link href={t.href as Route} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-bg-hover">
                <span className={cn("flex size-3.5 items-center justify-center rounded-sm border", t.done ? "border-accent bg-accent text-accent-fg" : "border-border-strong")}>
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
