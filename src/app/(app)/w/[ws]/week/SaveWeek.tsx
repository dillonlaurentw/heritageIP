"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveWeekAsPage } from "@/app/actions/ops";
import { Button } from "@/components/ui/Button";

export function SaveWeek({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <Button
      variant="primary"
      disabled={busy}
      onClick={() =>
        start(async () => {
          const res = await saveWeekAsPage(workspaceId);
          if (res.ok) router.push(res.href as Route);
        })
      }
    >
      {busy ? "Saving…" : "Save as a page"}
    </Button>
  );
}
