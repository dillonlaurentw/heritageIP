import type { Route } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/time";

type Item = {
  id: string;
  kind: string;
  actor: string;
  at: string;
  page: { id: string; title: string } | null;
  data: Record<string, unknown>;
};

const VERB: Record<string, string> = {
  "workspace.created": "started the workspace",
  "page.created": "created",
  "page.archived": "moved to trash",
  "member.joined": "joined",
  "member.left": "left",
  "member.removed": "removed someone",
  "row.done": "finished",
  "row.created": "added",
  "meeting.actions": "sent action items to Tasks from",
  "signal.accepted": "connected with",
};

export function ActivityFeed({ items, workspaceSlug }: { items: Item[]; workspaceSlug: string }) {
  if (items.length === 0) return <p className="text-sm text-fg-subtle">Nothing yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((a) => {
        const title = a.page?.title || (typeof a.data.title === "string" ? a.data.title : "");
        return (
          <li key={a.id} className="flex gap-2.5 text-sm">
            <Avatar name={a.actor} size="sm" className="mt-0.5" />
            <p className="min-w-0 flex-1 text-fg-muted">
              <span className="font-medium text-fg">{a.actor.split(" ")[0]}</span> {VERB[a.kind] ?? a.kind}{" "}
              {a.page ? (
                <Link href={`/w/${workspaceSlug}/${a.page.id}` as Route} className="font-medium text-fg hover:underline">
                  {title || "Untitled"}
                </Link>
              ) : (
                title && <span className="text-fg">{title}</span>
              )}
              {typeof a.data.with === "string" && <span className="text-fg"> {a.data.with}</span>}
              <span className="ml-1.5 text-xs text-fg-subtle">{timeAgo(a.at)}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
