"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { requestMagicLink, type MagicLinkState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export function MagicLinkForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<MagicLinkState, FormData>(requestMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-surface shadow-card p-6 text-center">
        <MailCheck className="size-6 text-accent-text" />
        <p className="text-base font-medium">Check your inbox</p>
        <p className="text-sm text-fg-muted">
          We sent a link to <span className="text-fg">{state.email}</span>. It works once and expires in 15 minutes.
        </p>
        {state.devLink && (
          <a href={state.devLink} className="mt-3 text-sm font-medium text-accent-text underline underline-offset-4">
            No email set up (dev): open the link
          </a>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" error={state.status === "error" ? state.message : null}>
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className="h-9"
          aria-invalid={state.status === "error"}
        />
      </Field>
      <Button type="submit" variant="primary" size="md" disabled={pending} className="h-9 w-full">
        {pending ? "Sending…" : "Continue with email"}
      </Button>
    </form>
  );
}
