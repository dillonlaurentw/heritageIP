"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";

/** Runs a server action, shows its message if it fails, and refreshes the page. */
export function useAct() {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, done?: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return toast(r.message ?? "Something went wrong.", "danger");
      if (done) toast(done);
      after?.();
      router.refresh();
    });
  return { run, busy };
}
