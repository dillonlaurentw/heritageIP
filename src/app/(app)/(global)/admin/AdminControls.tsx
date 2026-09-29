"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { featurePartner, featureWorkspace, linkPartnerManager } from "@/app/actions/admin";
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
