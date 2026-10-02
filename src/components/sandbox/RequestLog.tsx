"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Code } from "@/components/site/Code";
import { cn } from "@/lib/cn";
import type { AuditRow, LogEntry } from "./types";

/** Every request the console made, newest first, and the sandbox's activity log. */
export function RequestLog({ log, audit, keys }: { log: LogEntry[]; audit: AuditRow[]; keys: Record<string, string> }) {
  const [tab, setTab] = useState<"requests" | "activity">("requests");
  const [open, setOpen] = useState<number | null>(null);
  const shown = open ?? log.find((l) => l.method !== "GET")?.id ?? null;

  return (
    <Card className="flex max-h-[calc(100dvh-6rem)] min-w-0 flex-col self-start xl:sticky xl:top-6">
      <div className="flex items-center gap-1 border-b border-border p-2">
        {(["requests", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("h-7 rounded-full px-3 text-sm", tab === t ? "bg-bg-active font-medium text-fg" : "text-fg-muted hover:text-fg")}
          >
            {t === "requests" ? "API requests" : "Activity log"}
          </button>
        ))}
      </div>

      <div className="scroll-quiet flex-1 overflow-y-auto">
        {tab === "requests" ? (
          log.length === 0 ? (
            <p className="p-4 text-sm text-fg-muted">Requests appear here as you use the sandbox.</p>
          ) : (
            <ul className="flex flex-col">
              {log.map((l) => (
                <li key={l.id} className="border-b border-border last:border-0">
                  <button onClick={() => setOpen(shown === l.id ? -1 : l.id)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-bg-hover">
                    <span className="w-12 shrink-0 font-mono text-2xs text-fg-subtle">{l.method}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">{l.path.replace("/api/v1", "")}</span>
                    <span className={cn("font-mono text-2xs", l.status >= 400 ? "text-accent-text" : "text-success")}>{l.status}</span>
                    <span className="w-12 text-right font-mono text-2xs text-fg-subtle">{l.ms}ms</span>
                  </button>
                  {shown === l.id && (
                    <div className="flex flex-col gap-2 px-3 pb-3">
                      {l.body !== undefined && <Code label="Request" code={JSON.stringify(l.body, null, 2)} />}
                      <Code label={`Response · ${l.status}`} code={JSON.stringify(l.response, null, 2)} className="max-h-96 overflow-y-auto" />
                      <Code label="curl" code={curl(l, keys[l.service] ?? "")} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul className="flex flex-col">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-col gap-0.5 border-b border-border px-3 py-2.5 last:border-0">
                <span className="flex items-center gap-2 font-mono text-2xs text-fg-subtle">
                  <span>{a.actor}</span>
                  <span>{a.action}</span>
                  <span className="ml-auto">{new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </span>
                <span className="text-sm">{a.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function curl(l: LogEntry, key: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const parts = [`curl -X ${l.method} ${origin}${l.path}`, `  -H "Authorization: Bearer ${key}"`];
  if (l.body !== undefined) parts.push(`  -H "Content-Type: application/json"`, `  -d '${JSON.stringify(l.body)}'`);
  return parts.join(" \\\n");
}
