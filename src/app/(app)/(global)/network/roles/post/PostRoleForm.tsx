"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { postRoleAction } from "@/app/actions/network";
import type { WorkspaceOption } from "@/components/network/RequestForm";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

const COMMITMENTS = [
  { id: "cofounder", name: "Co-founder" },
  { id: "parttime", name: "Part-time" },
  { id: "advisor", name: "Advisor" },
  { id: "freelance", name: "Freelance" },
] as const;

export function PostRoleForm({ options, defaultWs, defaultStep }: { options: WorkspaceOption[]; defaultWs?: string; defaultStep?: string }) {
  const router = useRouter();
  const first = options.find((o) => o.slug === defaultWs) ?? options[0];
  const [ws, setWs] = useState(first?.id ?? "");
  const current = options.find((o) => o.id === ws);
  const [step, setStep] = useState(defaultStep && first?.steps.some((s) => s.id === defaultStep) ? defaultStep : (first?.steps.find((s) => s.needs.includes("COFOUNDER"))?.id ?? ""));
  const [title, setTitle] = useState("");
  const [commitment, setCommitment] = useState<(typeof COMMITMENTS)[number]["id"]>("cofounder");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  if (!options.length) return <p className="text-sm text-fg-muted">Start a company workspace first; roles are posted by a company.</p>;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await postRoleAction({ workspaceId: ws, title, commitment, skills, description, stepId: step || null });
          if (!res.ok) return setError(res.message);
          router.push(res.href as Route);
        });
      }}
    >
      {options.length > 1 && (
        <Field label="Company">
          <Select
            value={ws}
            onChange={(e) => {
              setWs(e.target.value);
              setStep("");
            }}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Role">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Operations co-founder" required className="h-9 text-md" />
      </Field>
      <div role="group" aria-labelledby="commitment-label" className="flex flex-col gap-1.5">
        <span id="commitment-label" className="text-sm font-medium">
          Commitment
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COMMITMENTS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={commitment === c.id}
              onClick={() => setCommitment(c.id)}
              className={`h-7 rounded-md border px-2.5 text-sm ${commitment === c.id ? "border-accent bg-accent-soft text-accent-text" : "border-border hover:bg-bg-hover"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <Field label="Skills" hint="A few words: what they'd be great at.">
        <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Manufacturing, supply chain, Portuguese" />
      </Field>
      <Field label="What they'd do" hint="Plain words. What the first three months look like.">
        <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      {current && current.steps.length > 0 && (
        <Field label="Game-plan step" hint="Optional. Links the role to the step that needs it.">
          <Select value={step} onChange={(e) => setStep(e.target.value)}>
            <option value="">No particular step</option>
            {current.steps.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div>
        <Button type="submit" variant="primary" size="md" disabled={busy || title.trim().length < 3}>
          {busy ? "Posting…" : "Post to the Network"}
        </Button>
      </div>
    </form>
  );
}
