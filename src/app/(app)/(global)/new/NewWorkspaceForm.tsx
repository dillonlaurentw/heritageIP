"use client";

import { useActionState } from "react";
import { createWorkspaceAction, type CreateState } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

export function NewWorkspaceForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(createWorkspaceAction, {});
  return (
    <form action={action} className="flex max-w-xl flex-col gap-5">
      <Field label="Name" hint="A working name is fine." error={state.errors?.name}>
        <Input name="name" autoFocus required placeholder="Tidewater Kelp" className="h-9 text-md" aria-invalid={!!state.errors?.name} />
      </Field>
      <Field label="One line" hint="What it is, in a sentence. Optional." error={state.errors?.oneLiner}>
        <Input name="oneLiner" placeholder="Seaweed packaging for coastal food producers" />
      </Field>
      <Field label="The idea" hint="The thought it started from, in your own words. Optional." error={state.errors?.rawIdea}>
        <Textarea name="rawIdea" rows={4} placeholder="Fish processors on the coast ship in plastic trays that…" />
      </Field>
      <div>
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Creating…" : "Create workspace"}
        </Button>
      </div>
    </form>
  );
}
