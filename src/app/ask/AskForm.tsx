"use client";

import { useState, useTransition } from "react";
import { askSelf } from "@/app/hubs/[slug]/agents/actions";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

export function AskForm({ hubs }: { hubs: { id: string; name: string }[] }) {
  const [q, setQ] = useState("");
  const [hubId, setHubId] = useState(hubs[0]?.id ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const go = () =>
    start(async () => {
      const res = await askSelf(q, hubId);
      if (res && !res.ok) setMsg(res.message);
    });

  return (
    <div className="flex flex-col gap-8">
      <TextArea
        autoFocus
        scale="title"
        placeholder="How do I price the pilot? What should I ask a supplier? Explain vesting…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go();
        }}
        rows={2}
      />
      <div className="flex flex-wrap items-end gap-6">
        {hubs.length > 1 && (
          <label className="block min-w-64">
            <Label>About which hub</Label>
            <select
              value={hubId}
              onChange={(e) => setHubId(e.target.value)}
              className="mt-2 w-full rounded-xs border border-line bg-field px-3 py-3 text-body text-bone"
            >
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button onClick={go} disabled={busy || !q.trim()}>
          {busy ? "Finding the right agent" : "Ask"}
        </Button>
        {msg && <span className="label text-signal">{msg}</span>}
      </div>
      <Label>SELF sends your question to the right agent for {hubs.length > 1 ? "that hub" : hubs[0]?.name}: strategy, go-to-market, operations, fundraising or legal.</Label>
    </div>
  );
}
