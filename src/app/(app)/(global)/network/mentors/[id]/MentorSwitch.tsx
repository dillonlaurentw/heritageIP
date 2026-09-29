"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setMentorOpen } from "@/app/actions/network";
import { Switch } from "@/components/ui/Switch";

export function MentorSwitch({ open }: { open: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <label className="flex items-center gap-3 text-sm">
      <Switch
        label="Taking new requests"
        checked={open}
        disabled={busy}
        onCheckedChange={(v) =>
          start(async () => {
            await setMentorOpen(v);
            router.refresh();
          })
        }
      />
      {open ? "Taking new requests" : "Paused: builders can see you but can't ask"}
    </label>
  );
}
