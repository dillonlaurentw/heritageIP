"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setDiscovery } from "@/app/actions/network";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

type State = { discoverable: boolean; sector: string | null; backerAsk: string };

export function DiscoveryPanel({
  workspaceId,
  slug,
  initial,
  hasThesis,
  editable,
  sectors,
}: {
  workspaceId: string;
  slug: string;
  initial: State;
  hasThesis: boolean;
  editable: boolean;
  sectors: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const save = (next: State) =>
    start(async () => {
      setError(null);
      const res = await setDiscovery(workspaceId, next as Parameters<typeof setDiscovery>[1]);
      if (!res.ok) {
        setError(res.message);
        setF((x) => ({ ...x, discoverable: initial.discoverable }));
        return;
      }
      toast(next.discoverable ? "Open to backers" : "Saved");
      router.refresh();
    });

  if (!hasThesis) {
    return (
      <p className="rounded-lg bg-bg-subtle px-4 py-3 text-sm">
        Backers read your thesis first.{" "}
        <Link href={`/w/${slug}/thesis` as Route} className="font-medium text-accent-text hover:underline">
          Write the thesis →
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex items-center gap-3 rounded-lg border border-border p-4">
        <Switch
          label="Open to backers"
          checked={f.discoverable}
          disabled={!editable || busy}
          onCheckedChange={(v) => {
            const next = { ...f, discoverable: v };
            setF(next);
            save(next);
          }}
        />
        <span>
          <span className="block text-base font-medium">{f.discoverable ? "Open to backers" : "Hidden from backers"}</span>
          <span className="block text-sm text-fg-muted">
            {f.discoverable ? (
              <>
                Backers can find it.{" "}
                <Link href={`/network/backers/${slug}` as Route} className="underline underline-offset-2">
                  See what they see
                </Link>
              </>
            ) : (
              "Only people you've already connected with can see the teaser."
            )}
          </span>
        </span>
      </label>
      <Field label="Sector">
        <Select value={f.sector ?? ""} onChange={(e) => setF({ ...f, sector: e.target.value || null })} disabled={!editable}>
          <option value="">Pick one</option>
          {sectors.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <Field label="What you're looking for in a backer" hint="Experience, networks, help. No amounts, valuations or terms: SELF is introductions only.">
        <Textarea rows={3} value={f.backerAsk} onChange={(e) => setF({ ...f, backerAsk: e.target.value })} disabled={!editable} />
      </Field>
      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {editable && (
        <div>
          <Button variant="primary" size="md" disabled={busy} onClick={() => save(f)}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
