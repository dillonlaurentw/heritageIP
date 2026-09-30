"use client";

import { useState } from "react";
import { opportunityAnswer, opportunityAsk, opportunityClose, opportunityCreate, opportunityWithdraw } from "@/app/actions/founder";
import { useAct } from "@/components/founder/useAct";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";

type Opp = { id: string; kindLabel: string; title: string; description: string; place: string; startsAt: string; seats: number; forWho: string; costNote: string | null; open: boolean; host: { name: string; line: string | null } };
type Mine = Opp & { why: string | null; request: string | null };
type Hosted = Opp & { picked: number; requests: { id: string; why: string; status: string; who: { name: string; headline: string | null } }[] };

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const STATUS: Record<string, string> = { PENDING: "Asked · the host will pick", PICKED: "You're in. Message the host in Messages.", NOT_THIS_TIME: "Not this time. There'll be others.", WITHDRAWN: "Withdrawn" };

export function OpportunitiesClient({ mine, hosted, canHost }: { mine: Mine[]; hosted: Hosted[]; canHost: boolean }) {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        {mine.length === 0 && <p className="text-md text-fg-subtle">Nothing that fits you right now. New ones come up every few weeks.</p>}
        {mine.map((o) => (
          <OppCard key={o.id} o={o} />
        ))}
      </section>
      {canHost && <Hosting hosted={hosted} />}
    </div>
  );
}

function OppCard({ o }: { o: Mine }) {
  const { run, busy } = useAct();
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState("");
  return (
    <Card className="flex flex-col gap-2 px-6 py-5">
      <span className="font-mono text-2xs text-fg-subtle uppercase">
        {o.kindLabel} · {o.place} · {when(o.startsAt)}
      </span>
      <h2 className="text-lg font-medium">{o.title}</h2>
      <p className="text-base">{o.description}</p>
      <p className="text-sm text-fg-muted">
        Hosted by {o.host.name}
        {o.host.line ? `, ${o.host.line}` : ""} · {o.seats} seats{o.costNote ? ` · ${o.costNote}` : ""}
      </p>
      {o.request ? (
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{STATUS[o.request]}</span>
          {(o.request === "PENDING" || o.request === "PICKED") && (
            <button type="button" disabled={busy} className="text-fg-subtle hover:text-fg" onClick={() => run(() => opportunityWithdraw(o.id))}>
              {o.request === "PICKED" ? "I can't make it" : "Withdraw"}
            </button>
          )}
        </div>
      ) : (
        <>
          {o.why && <p className="text-sm text-fg-subtle">Why you&apos;re seeing this: {o.why}</p>}
          {open ? (
            <div className="flex flex-col gap-2">
              <Textarea rows={2} autoFocus value={why} onChange={(e) => setWhy(e.target.value)} placeholder={`In a line, why you'd like to come. ${o.host.name.split(" ")[0]} reads this to pick.`} aria-label="Why you'd like to come" />
              <div className="flex gap-2">
                <Button size="sm" variant="primary" disabled={busy || why.trim().length < 15} onClick={() => run(() => opportunityAsk(o.id, why), "Asked. The host will pick.")}>
                  Send
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            o.open && (
              <Button size="sm" className="self-start" onClick={() => setOpen(true)}>
                I&apos;d like to come
              </Button>
            )
          )}
        </>
      )}
    </Card>
  );
}

const KINDS: [string, string][] = [["DINNER", "Dinner"], ["TRIP", "Trip"], ["WORKSHOP", "Workshop"], ["EVENT", "Event seat"], ["INTRO_DAY", "Intro day"]];
const FIELDS: [string, string][] = [["FOOD", "Food"], ["CLIMATE", "Climate"], ["HEALTH", "Health"], ["MONEY", "Fintech"], ["SOFTWARE", "Software"], ["CONSUMER", "Consumer"], ["HARDWARE", "Hardware"]];
const STAGES: [string, string][] = [["IDEA", "Idea"], ["BUILDING", "First build"], ["FIRST_CUSTOMERS", "First customers"], ["GROWING", "Growing"]];
const toggle = (l: string[], k: string) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]);

function Pills({ options, on, onToggle }: { options: [string, string][]; on: (k: string) => boolean; onToggle: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([k, v]) => (
        <button key={k} type="button" onClick={() => onToggle(k)} className={cn("rounded-full border px-3 py-1 text-sm", on(k) ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface")}>
          {v}
        </button>
      ))}
    </div>
  );
}

function Hosting({ hosted }: { hosted: Hosted[] }) {
  const { run, busy } = useAct();
  const [form, setForm] = useState(false);
  const [f, setF] = useState({ kind: "DINNER", title: "", description: "", place: "", date: "", seats: 8, forWho: "", fields: [] as string[], stages: [] as string[], buildingOnly: false, costNote: "" });
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Eyebrow>What you&apos;re hosting</Eyebrow>
        {!form && (
          <Button size="xs" onClick={() => setForm(true)}>
            Host something
          </Button>
        )}
      </div>
      {form && (
        <Card lift className="flex flex-col gap-4 p-6">
          <Pills options={KINDS} on={(k) => f.kind === k} onToggle={(k) => setF({ ...f, kind: k })} />
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title: Food founders dinner" aria-label="Title" />
          <Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What it is" aria-label="What it is" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} placeholder="Where (or Online)" aria-label="Where" />
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
            <Input type="number" min={1} max={200} value={f.seats} onChange={(e) => setF({ ...f, seats: Number(e.target.value) })} aria-label="Seats" />
          </div>
          <Input value={f.forWho} onChange={(e) => setF({ ...f, forWho: e.target.value })} placeholder="Who it's for, in words" aria-label="Who it's for" />
          <span className="text-sm text-fg-muted">Only these fields (none = anyone)</span>
          <Pills options={FIELDS} on={(k) => f.fields.includes(k)} onToggle={(k) => setF({ ...f, fields: toggle(f.fields, k) })} />
          <span className="text-sm text-fg-muted">Only these stages (none = any)</span>
          <Pills options={STAGES} on={(k) => f.stages.includes(k)} onToggle={(k) => setF({ ...f, stages: toggle(f.stages, k) })} />
          <Switch label="Only people building lately" checked={f.buildingOnly} onCheckedChange={(v) => setF({ ...f, buildingOnly: v })} />
          <Input value={f.costNote} onChange={(e) => setF({ ...f, costNote: e.target.value })} placeholder="Cost, in words: Dinner is on me" aria-label="Cost" />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" disabled={busy || !f.date} onClick={() => run(() => opportunityCreate({ ...f, kind: f.kind as "DINNER" }), "Posted.", () => setForm(false))}>
              Post it
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
      {hosted.length === 0 && !form && <p className="text-sm text-fg-subtle">Nothing yet. A dinner, a factory visit, an hour online: small and real works best.</p>}
      {hosted.map((o) => (
        <div key={o.id} className="flex flex-col gap-3">
          <div>
            <h3 className="text-md font-medium">{o.title}</h3>
            <p className="text-sm text-fg-muted">
              {o.place} · {when(o.startsAt)} · {o.picked} of {o.seats} seats picked{o.open ? "" : " · closed"}
            </p>
          </div>
          {o.requests.length === 0 && <p className="text-sm text-fg-subtle">Nobody has asked yet.</p>}
          {o.requests.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2 px-5 py-4">
              <span className="flex items-center gap-3">
                <Avatar name={r.who.name} />
                <span className="flex flex-col">
                  <span className="text-base font-medium">{r.who.name}</span>
                  <span className="text-sm text-fg-muted">{r.who.headline}</span>
                </span>
              </span>
              <p className="text-base">{r.why}</p>
              {r.status === "PENDING" ? (
                <div className="flex gap-2">
                  <Button size="xs" variant="primary" disabled={busy} onClick={() => run(() => opportunityAnswer(r.id, true), "Picked. You can message each other.")}>
                    Pick {r.who.name.split(" ")[0]}
                  </Button>
                  <Button size="xs" variant="ghost" disabled={busy} onClick={() => run(() => opportunityAnswer(r.id, false))}>
                    Not this time
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-fg-subtle">{r.status === "PICKED" ? "Picked." : "Not this time."}</span>
              )}
            </Card>
          ))}
          {o.open && (
            <button type="button" className="self-start text-sm text-fg-subtle hover:text-fg" onClick={() => run(() => opportunityClose(o.id))}>
              Stop taking requests
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
