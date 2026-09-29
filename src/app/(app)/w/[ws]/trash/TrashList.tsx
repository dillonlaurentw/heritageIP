"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteForeverAction, restorePageAction } from "@/app/actions/pages";
import { Button } from "@/components/ui/Button";
import { PageIcon } from "@/components/ui/PageIcon";
import { useToast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/time";

type Item = { id: string; title: string; icon: string | null; at: string; href: string; where: string; canRestore: boolean; canDelete: boolean };

export function TrashList({ items }: { items: Item[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(res.message ?? "Couldn't do that.", "danger");
      else {
        toast(done);
        router.refresh();
      }
    });
  return (
    <ul className="divide-y divide-border rounded-xl bg-surface shadow-card">
      {items.map((i) => (
        <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
          <PageIcon icon={i.icon} />
          <Link href={i.href as Route} className="min-w-0 flex-1 truncate text-base hover:underline">
            {i.title || "Untitled"}
          </Link>
          <span className="hidden text-xs text-fg-subtle sm:inline">
            {i.where} · {timeAgo(i.at)}
          </span>
          {i.canRestore && (
            <Button size="xs" disabled={pending} onClick={() => run(() => restorePageAction(i.id), "Restored")}>
              Restore
            </Button>
          )}
          {i.canDelete && (
            <Button size="xs" variant="ghost" disabled={pending} onClick={() => run(() => deleteForeverAction(i.id), "Deleted for good")}>
              Delete
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
