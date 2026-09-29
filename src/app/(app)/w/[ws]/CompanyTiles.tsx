"use client";

import { CalendarRange, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createFromTemplate } from "@/app/actions/templates";
import { PageIcon } from "@/components/ui/PageIcon";
import { useToast } from "@/components/ui/Toast";

export type CompanyTile = { key: string; title: string; icon: string; blurb: string; href: string | null };

/** "Run the company": the built-in databases, each one click to open or add. */
export function CompanyTiles({ workspaceId, slug, tiles, editable }: { workspaceId: string; slug: string; tiles: CompanyTile[]; editable: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  const add = (key: string) =>
    start(async () => {
      const res = await createFromTemplate(workspaceId, key);
      if (!res.ok) return toast(res.message, "danger");
      router.push(res.href as Route);
    });

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-medium text-fg-muted">Run the company</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <Link
          href={`/w/${slug}/week` as Route}
          className="flex flex-col gap-1 rounded-md border border-border px-3 py-2.5 hover:border-border-strong hover:bg-bg-hover"
        >
          <span className="flex items-center gap-2 text-base font-medium">
            <CalendarRange className="size-4 text-fg-muted" /> This week
          </span>
          <span className="line-clamp-1 text-xs text-fg-muted">What changed, what&apos;s due, how goals are moving.</span>
        </Link>
        {tiles.map((t) =>
          t.href ? (
            <Link
              key={t.key}
              href={t.href as Route}
              className="flex flex-col gap-1 rounded-md border border-border px-3 py-2.5 hover:border-border-strong hover:bg-bg-hover"
            >
              <span className="flex items-center gap-2 text-base font-medium">
                <PageIcon icon={t.icon} /> {t.title}
              </span>
              <span className="line-clamp-1 text-xs text-fg-muted">{t.blurb}</span>
            </Link>
          ) : editable ? (
            <button
              key={t.key}
              type="button"
              disabled={busy}
              onClick={() => add(t.key)}
              className="flex flex-col gap-1 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-fg-muted hover:border-border-strong hover:bg-bg-hover hover:text-fg"
            >
              <span className="flex items-center gap-2 text-base font-medium">
                <Plus className="size-4" /> {t.title}
              </span>
              <span className="line-clamp-1 text-xs">{t.blurb}</span>
            </button>
          ) : null,
        )}
      </div>
    </section>
  );
}
