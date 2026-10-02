"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { decideShare } from "@/app/actions/sandbox";
import { cn } from "@/lib/cn";

/** Sign in at the source (simulated), choose what to share, approve or decline. */
export function ConsentForm({
  grantId,
  from,
  to,
  requested,
  accounts,
}: {
  grantId: string;
  from: string;
  to: string;
  requested: Array<{ key: string; label: string }>;
  accounts: Array<{ id: string; label: string; detail: string }>;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<string | null>(null);
  const [cats, setCats] = useState(requested.map((r) => r.key));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const decide = (approve: boolean) =>
    start(async () => {
      const r = await decideShare({ grantId, approve, fromProfileId: account ?? undefined, categories: cats });
      if (!r.ok) return setError(r.message);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">1. Sign in to {from}</h2>
        <p className="text-sm text-fg-muted">
          In production you&apos;d sign in at {from} itself, so it can confirm which account is yours. Here, pick the synthetic
          account. Self never guesses from a matching email.
        </p>
        <div className="flex flex-col gap-1.5">
          {accounts.map((a) => (
            <label
              key={a.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 shadow-[inset_0_0_0_1px_var(--border)] transition-colors",
                account === a.id ? "bg-bg-active shadow-[inset_0_0_0_1px_var(--border-strong)]" : "hover:bg-bg-hover",
              )}
            >
              <input type="radio" name="account" checked={account === a.id} onChange={() => setAccount(a.id)} className="accent-(--primary)" />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{a.label}</span>
                <span className="font-mono text-2xs text-fg-subtle">{a.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">2. Choose what {to} can use</h2>
        <p className="text-sm text-fg-muted">
          Only what you tick, only while you allow it. Your history with {from} stays there.
        </p>
        <div className="flex flex-wrap gap-2">
          {requested.map((r) => {
            const on = cats.includes(r.key);
            return (
              <label key={r.key} className="flex items-center gap-2 rounded-full bg-bg-inset px-3 py-1.5 text-sm">
                <input type="checkbox" checked={on} onChange={() => setCats(on ? cats.filter((c) => c !== r.key) : [...cats, r.key])} className="accent-(--primary)" />
                {r.label}
              </label>
            );
          })}
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="lg" disabled={pending || !account || !cats.length} onClick={() => decide(true)}>
          Allow
        </Button>
        <Button variant="secondary" size="lg" disabled={pending} onClick={() => decide(false)}>
          Don&apos;t allow
        </Button>
      </div>
    </div>
  );
}
