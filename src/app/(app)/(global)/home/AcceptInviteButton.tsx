"use client";

import { useTransition } from "react";
import { acceptInvite } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function AcceptInviteButton({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button
      variant="primary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await acceptInvite(token);
          if (res && !res.ok) toast(res.message, "danger");
        })
      }
    >
      {pending ? "Joining…" : "Join"}
    </Button>
  );
}
