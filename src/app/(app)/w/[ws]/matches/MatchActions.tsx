"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteMatch, reexplainMatch } from "@/app/actions/matches";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

/** "Start a conversation": a short note. They answer in Connections; a yes opens Messages. */
export function InviteForm({ workspaceId, chairKey, personId, first, chairTitle }: { workspaceId: string; chairKey: string; personId: string; first: string; chairTitle: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, start] = useTransition();
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={() => setOpen(true)}>
          Start a conversation
        </Button>
        <span className="text-sm text-fg-muted">{first} decides. If they say yes, you can message each other.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="invite-note" className="text-sm text-fg-muted">
        Why you&apos;re reaching out about {chairTitle.toLowerCase()}
      </label>
      <Textarea id="invite-note" rows={4} autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Hi ${first}, I'm looking for…`} />
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          disabled={busy || note.trim().length < 10}
          onClick={() =>
            start(async () => {
              const res = await inviteMatch(workspaceId, chairKey, personId, note);
              if (!res.ok) return toast(res.message, "danger");
              toast(`Sent. ${first} will see it in their connections.`);
              router.refresh();
            })
          }
        >
          Send
        </Button>
        <Button variant="ghost" size="md" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function Reexplain({ workspaceId, chairKey, personId }: { workspaceId: string; chairKey: string; personId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      className="underline underline-offset-2 hover:text-fg"
      onClick={() =>
        start(async () => {
          const res = await reexplainMatch(workspaceId, chairKey, personId);
          if (!res.ok) toast(res.message, "danger");
          router.refresh();
        })
      }
    >
      {busy ? "Thinking…" : "Explain again"}
    </button>
  );
}
