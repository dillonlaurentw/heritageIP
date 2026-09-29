"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createFromTemplate } from "@/app/actions/templates";
import { useToast } from "@/components/ui/Toast";
import type { TemplateGroup } from "@/lib/templates";

type T = { key: string; title: string; icon: string; blurb: string; group: TemplateGroup; kind: string };
const GROUPS: TemplateGroup[] = ["Think", "Plan", "Run", "Team"];

export function TemplateGrid({ workspaceId, templates, editable }: { workspaceId: string; templates: T[]; editable: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-10">
      {GROUPS.map((g) => (
        <section key={g}>
          <h2 className="mb-3 text-sm font-medium text-fg-muted">{g}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates
              .filter((t) => t.group === g)
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={!editable || pending}
                  onClick={() =>
                    start(async () => {
                      const res = await createFromTemplate(workspaceId, t.key);
                      if (res.ok) router.push(res.href as Route);
                      else toast(res.message, "danger");
                    })
                  }
                  className="flex flex-col gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:border-border-strong hover:bg-bg-hover disabled:opacity-60"
                >
                  <span className="text-2xl leading-none">{t.icon}</span>
                  <span className="text-base font-semibold">{t.title}</span>
                  <span className="text-sm text-fg-muted">{t.blurb}</span>
                  {t.kind === "database" && <span className="text-xs text-fg-subtle">Database</span>}
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
