"use client";

import { useState, useTransition } from "react";
import { proposeSection, saveSection } from "./actions";
import { AgentStrip, type AgentState } from "@/components/agents/AgentStrip";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { GTM_COPY, type GtmSection } from "@/lib/gtm-sections";

type Proposal = { content: string; rationale: string; demo: boolean };

/**
 * One workspace section. The agent only ever PROPOSES: its draft appears
 * beside yours, and nothing changes until you choose "Use this".
 */
export function GtmSectionEditor({
  hubId,
  section,
  index,
  initial,
  canAsk,
  live,
}: {
  hubId: string;
  section: GtmSection;
  index: number;
  initial: string;
  canAsk: boolean;
  live: boolean;
}) {
  const copy = GTM_COPY[section];
  const [saved, setSaved] = useState(initial);
  const [text, setText] = useState(initial);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [state, setState] = useState<AgentState>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const dirty = text.trim() !== saved.trim();

  function ask() {
    setState("thinking");
    setMsg(null);
    start(async () => {
      const res = await proposeSection(hubId, section, saved.trim() ? "sharpen" : "draft");
      if (res.ok) {
        setProposal({ ...res.output, demo: res.demo });
        setState("done");
      } else {
        setMsg(res.message);
        setState("error");
      }
    });
  }

  function save(content: string, after?: () => void) {
    start(async () => {
      const res = await saveSection(hubId, section, content);
      if (res.ok) {
        setSaved(content);
        setText(content);
        setMsg("Saved.");
        after?.();
      } else setMsg(res.message);
    });
  }

  return (
    <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 lg:grid-cols-[16rem_1fr]">
      <div className="flex flex-col gap-3 self-start">
        <Label tone={saved.trim() ? "bone" : "smoke"}>
          {String(index + 1).padStart(2, "0")} · {saved.trim() ? "Written" : "Empty"}
        </Label>
        <h2 className="type-display text-title">{copy.label}</h2>
        <p className="text-small text-smoke">{copy.line}</p>
      </div>

      <div className="flex flex-col gap-6">
        <TextArea placeholder={copy.placeholder} value={text} onChange={(e) => setText(e.target.value)} rows={6} />
        <div className="flex flex-wrap items-center gap-4">
          {dirty && (
            <Button onClick={() => save(text)} disabled={busy}>
              Save
            </Button>
          )}
          {canAsk && (
            <Button variant="ghost" onClick={ask} disabled={busy}>
              {state === "thinking" ? "Thinking" : saved.trim() ? "Sharpen with SELF" : "Draft with SELF"}
            </Button>
          )}
          {dirty && (
            <button type="button" onClick={() => setText(saved)} className="text-small font-medium text-smoke hover:text-bone">
              Undo changes
            </button>
          )}
          {msg && <span className={`label ${msg === "Saved." ? "text-bone" : "text-signal"}`}>{msg}</span>}
        </div>

        {state === "thinking" && <AgentStrip agent="GTM agent" state="thinking" demo={!live} right={copy.label} />}

        {proposal && (
          <Reveal>
            <div className="flex flex-col gap-5 border border-signal p-5">
              <AgentStrip agent="GTM agent · Proposal" state="done" demo={proposal.demo} right={copy.label} />
              <p className="whitespace-pre-line text-lead">{proposal.content}</p>
              <p className="border-l-2 border-line pl-4 text-small text-smoke">{proposal.rationale}</p>
              <div className="flex flex-wrap items-center gap-4">
                <Button onClick={() => save(proposal.content, () => setProposal(null))} disabled={busy}>
                  Use this
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setText(proposal.content);
                    setProposal(null);
                  }}
                  className="text-body font-medium text-smoke hover:text-bone"
                >
                  Edit it first
                </button>
                <button type="button" onClick={() => setProposal(null)} className="text-body font-medium text-smoke hover:text-bone">
                  Discard
                </button>
              </div>
              {saved.trim() && <Label>Using this replaces your current {copy.label.toLowerCase()}.</Label>}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
