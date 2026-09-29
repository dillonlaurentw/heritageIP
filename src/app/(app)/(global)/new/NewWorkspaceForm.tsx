"use client";

import { useActionState } from "react";
import { createWorkspaceAction, type CreateState } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

/** The idea first, a working name second. Starting from an idea leads straight to the questions. */
export function NewWorkspaceForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(createWorkspaceAction, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Your idea" error={state.errors?.rawIdea}>
        <Textarea
          name="rawIdea"
          rows={5}
          autoFocus
          placeholder="Fish processors on the coast ship in plastic trays. Kelp grown right there could replace them…"
          className="rounded-lg px-4 py-3 text-md shadow-card"
        />
      </Field>
      <Field label="What should we call it for now?" hint="A working name is fine. You can change it later." error={state.errors?.name}>
        <Input name="name" required placeholder="Tidewater Kelp" aria-invalid={!!state.errors?.name} />
      </Field>
      <input type="hidden" name="oneLiner" value="" />
      <div>
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? "Starting…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
