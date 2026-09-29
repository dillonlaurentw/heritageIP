"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { answerApplication, featurePartner, featureWorkspace, linkPartnerManager } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

export function FeatureSwitch({ kind, id, featured, name }: { kind: "workspace" | "partner"; id: string; featured: boolean; name: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <Switch
      label={`Feature ${name}`}
      checked={featured}
      disabled={busy}
      onCheckedChange={(v) =>
        start(async () => {
          await (kind === "workspace" ? featureWorkspace(id, v) : featurePartner(id, v));
          router.refresh();
        })
      }
    />
  );
}

export function ManagerSelect({ partnerId, current, options }: { partnerId: string; current: string | null; options: { id: string; name: string; org: string | null }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  return (
    <select
      aria-label="Who manages this firm"
      value={current ?? ""}
      disabled={busy}
      onChange={(e) =>
        start(async () => {
          const res = await linkPartnerManager(partnerId, e.target.value || null);
          if (!res.ok) toast(res.message, "danger");
          else toast(e.target.value ? "Linked. Waiting intros moved to them." : "Unlinked. Waiting intros go to the concierge.");
          router.refresh();
        })
      }
      className="h-7 max-w-52 rounded-md border border-border bg-bg px-1.5 text-sm"
    >
      <option value="">Concierge (unclaimed)</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
          {o.org ? ` · ${o.org}` : ""}
        </option>
      ))}
    </select>
  );
}

export function ApplicationAnswer({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  const answer = (approve: boolean) =>
    start(async () => {
      const res = await answerApplication(id, approve);
      if (!res.ok) toast(res.message, "danger");
      else toast(approve ? `${name} is in. They've joined a circle.` : "Answered.");
      router.refresh();
    });
  return (
    <div className="flex gap-2">
      <Button variant="primary" size="xs" disabled={busy} onClick={() => answer(true)}>
        Let them in
      </Button>
      <Button variant="ghost" size="xs" disabled={busy} onClick={() => answer(false)}>
        Not now
      </Button>
    </div>
  );
}
