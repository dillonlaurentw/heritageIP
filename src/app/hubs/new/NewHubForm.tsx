"use client";

import { useActionState } from "react";
import { createHub, type CreateState } from "../actions";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea, TextInput } from "@/components/ui/Field";

export function NewHubForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(createHub, {});
  return (
    <form action={action} className="flex flex-col gap-8">
      <TextArea
        name="rawIdea"
        scale="title"
        autoFocus
        label="The thought"
        placeholder="There's no good way to… What if…"
        error={state.errors?.rawIdea}
        hint="Messy is fine. SELF will help you sharpen it."
      />
      <TextInput name="name" label="A working name" placeholder="You can change it later" error={state.errors?.name} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating" : "Create the hub"}
        </Button>
      </div>
    </form>
  );
}
