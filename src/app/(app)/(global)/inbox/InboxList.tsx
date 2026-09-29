"use client";

import { AtSign, CheckCheck, Handshake, MessageSquare, Theater, UserCheck, UserPlus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { markAllRead, markRead } from "@/app/actions/comments";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";

type Item = { id: string; kind: string; text: string; href: string; read: boolean; at: string; actor: string; workspace: string | null };

const ICON: Record<string, ReactNode> = {
  MENTION: <AtSign />,
  COMMENT: <MessageSquare />,
  ASSIGNED: <UserCheck />,
  INVITE: <UserPlus />,
  SIGNAL: <Handshake />,
  SIGNAL_ANSWERED: <Handshake />,
  SIMULATION: <Theater />,
};

const FILTERS: { key: string; label: string; kinds: string[] | null }[] = [
  { key: "all", label: "All", kinds: null },
  { key: "mentions", label: "Mentions", kinds: ["MENTION"] },
  { key: "comments", label: "Comments", kinds: ["COMMENT"] },
  { key: "requests", label: "Requests", kinds: ["SIGNAL", "SIGNAL_ANSWERED", "INVITE"] },
];

export function InboxList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [busy, start] = useTransition();
  const kinds = FILTERS.find((f) => f.key === filter)?.kinds;
  const shown = items.filter((i) => !kinds || kinds.includes(i.kind));
  const unread = items.filter((i) => !i.read).length;

  const open = (i: Item) =>
    start(async () => {
      if (!i.read) await markRead([i.id]);
      router.push(i.href as Route);
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn("rounded-md px-2.5 py-1 text-sm", filter === f.key ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover")}
          >
            {f.label}
          </button>
        ))}
        {unread > 0 && (
          <Button
            variant="ghost"
            className="ml-auto"
            disabled={busy}
            onClick={() =>
              start(async () => {
                await markAllRead();
                router.refresh();
              })
            }
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState title="All clear." hint="Mentions, comments and requests will show up here." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {shown.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => open(i)}
                disabled={busy}
                className={cn("flex w-full items-start gap-3 px-2 py-3 text-left hover:bg-bg-hover", !i.read && "bg-accent-soft/40")}
              >
                <span className="relative mt-0.5">
                  <Avatar name={i.actor} size="md" />
                  <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-bg text-fg-muted [&>svg]:size-2.5">
                    {ICON[i.kind] ?? <MessageSquare />}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", !i.read && "font-medium")}>{i.text}</span>
                  <span className="mt-0.5 block text-xs text-fg-subtle">
                    {timeAgo(i.at)}
                    {i.workspace && ` · ${i.workspace}`}
                  </span>
                </span>
                {!i.read && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
