"use client";

import { useActionState } from "react";
import { requestMagicLink, type MagicLinkState } from "@/app/actions/auth";
import { Button } from "@/components/ui/ArrowLink";
import { TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

export function MagicLinkForm() {
  const [state, action, pending] = useActionState<MagicLinkState, FormData>(requestMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div>
        <p className="type-display text-headline">Check your inbox.</p>
        <p className="measure mt-4 text-lead text-smoke">
          We sent a link to <span className="text-bone">{state.email}</span>. It works once and expires in 15 minutes.
        </p>
        {state.devLink && (
          <a href={state.devLink} className="group mt-8 inline-flex items-baseline gap-3 border border-signal px-4 py-3">
            <Label tone="signal">Dev · No email configured</Label>
            <span className="font-semibold text-bone">Open magic link →</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="max-w-xl">
      <TextInput
        name="email"
        type="email"
        required
        autoComplete="email"
        scale="title"
        placeholder="you@somewhere.com"
        label="Email"
        error={state.status === "error" ? state.message : undefined}
      />
      <Button type="submit" disabled={pending} className="mt-8">
        {pending ? "Sending" : "Send my link"}
      </Button>
    </form>
  );
}
