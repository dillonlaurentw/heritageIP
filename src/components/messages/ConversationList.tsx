import type { Route } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { NeedsDot } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { listConversations } from "@/lib/messages";
import { timeAgo } from "@/lib/time";

/** The left column of Messages: one row per person, unread first in weight, newest first in order. */
export function ConversationList({ items, current }: { items: Awaited<ReturnType<typeof listConversations>>; current?: string }) {
  if (items.length === 0) {
    return <p className="px-2 text-sm text-fg-subtle">No conversations yet. They start when someone says yes to a request, or with people you work with.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}` as Route}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-bg-hover", c.id === current && "bg-surface shadow-card hover:bg-surface")}
          >
            <Avatar name={c.other.name} size="lg" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2">
                <span className={cn("truncate text-base", c.unread ? "font-semibold" : "font-medium")}>{c.other.name}</span>
                {c.unread && <NeedsDot />}
                <span className="ml-auto shrink-0 text-xs text-fg-subtle">{c.last ? timeAgo(c.last.at) : ""}</span>
              </span>
              <span className="truncate text-sm text-fg-muted">
                {c.last ? `${c.last.mine ? "You: " : ""}${c.last.text}` : c.about ? `About ${c.about}` : "Say hello"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
