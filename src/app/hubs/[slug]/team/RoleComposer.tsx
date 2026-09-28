"use client";

import { useState, useTransition } from "react";
import { postRole } from "./actions";
import { COMMITMENTS, type RoleInput } from "@/lib/role-schema";
import { Button } from "@/components/ui/ArrowLink";
import { Chips } from "@/components/ui/Chips";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

type StepOption = { id: string; title: string };

/** "Post a role" form. Opens pre-filled when arriving from a plan step. */
export function RoleComposer({
  hubId,
  steps,
  fromStep,
}: {
  hubId: string;
  steps: StepOption[];
  fromStep: StepOption | null;
}) {
  const [open, setOpen] = useState(Boolean(fromStep));
  const [v, setV] = useState<RoleInput>({
    title: "",
    commitment: "Co-founder",
    description: fromStep ? `For our plan step: ${fromStep.title}. ` : "",
    skills: [],
    planStepId: fromStep?.id ?? null,
  });
  const [skills, setSkills] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="group type-display text-headline">
        Post a role <span className="inline-block text-signal transition-transform group-hover:translate-x-2">→</span>
      </button>
    );
  }

  function submit() {
    start(async () => {
      const res = await postRole(hubId, {
        ...v,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (res.ok) {
        setOpen(false);
        setMsg(null);
        setV({ title: "", commitment: "Co-founder", description: "", skills: [], planStepId: null });
        setSkills("");
      } else setMsg(res.message);
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8 border border-line p-5">
      <Label tone="bone">New role</Label>
      <TextInput autoFocus scale="title" label="Role" placeholder="Technical co-founder" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      <div>
        <Label>Commitment</Label>
        <div className="mt-2">
          <Chips
            options={COMMITMENTS}
            value={[v.commitment]}
            onChange={(x) => setV({ ...v, commitment: x.find((c) => c !== v.commitment) ?? v.commitment })}
          />
        </div>
      </div>
      <TextArea
        label="What they'd own"
        hint="The work, the stakes, and what kind of person fits. Other builders read this."
        value={v.description}
        onChange={(e) => setV({ ...v, description: e.target.value })}
      />
      <TextInput label="Skills · Comma separated" placeholder="Brand, storytelling, fundraising" value={skills} onChange={(e) => setSkills(e.target.value)} />
      {steps.length > 0 && (
        <label className="block">
          <Label>For a game-plan step · Optional</Label>
          <select
            value={v.planStepId ?? ""}
            onChange={(e) => setV({ ...v, planStepId: e.target.value || null })}
            className="mt-2 w-full rounded-xs border border-line bg-field px-3 py-3 text-body text-bone"
          >
            <option value="">No step</option>
            {steps.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="text-small text-smoke">
        Posting shows other builders this role, plus your hub&apos;s name, one-liner and thesis statement. Your plan and
        contact details stay private.
      </p>
      {msg && <p className="label text-signal">{msg}</p>}
      <div className="flex items-center gap-4">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Posting" : "Post the role"}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="text-body font-medium text-smoke hover:text-bone">
          Cancel
        </button>
      </div>
    </div>
  );
}
