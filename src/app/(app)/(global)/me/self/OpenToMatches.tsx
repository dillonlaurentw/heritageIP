"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOpenToMatches } from "@/app/actions/self";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

/** Let founders with an open chair find you. Off by default; they see only what's listed here. */
export function OpenToMatches({ on, note }: { on: boolean; note: string }) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState(note);
  const [busy, start] = useTransition();
  const save = (value: boolean, n = text) =>
    start(async () => {
      const res = await setOpenToMatches(value, n);
      if (!res.ok) return toast(res.message, "danger");
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-between gap-3">
        <span className="text-base font-medium">Let founders find you</span>
        <Switch label="Let founders find you" checked={on} disabled={busy} onCheckedChange={(v) => save(v)} />
      </label>
      <p className="text-sm leading-relaxed text-fg-muted">
        Founders with an open chair see your name, headline, location, what you&apos;re strong at and building toward, and this
        note. They reach out; you decide.
      </p>
      {on && (
        <div className="flex gap-2">
          <Input aria-label="What you're open to" value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder="Brand and story, part-time to start" />
          <Button size="sm" disabled={busy || text === note} onClick={() => save(true)}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
