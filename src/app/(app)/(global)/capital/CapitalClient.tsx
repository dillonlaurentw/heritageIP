"use client";

import { useState } from "react";
import { capitalDeleteUpdate, capitalFollow, capitalInterest, capitalOpen, capitalUpdate } from "@/app/actions/founder";
import { useAct } from "@/components/founder/useAct";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { timeAgo } from "@/lib/time";

type Update = { id: string; text: string; at: string };

export function FounderCapital({ data }: { data: { openToBackers: boolean; updates: Update[]; followers: string[]; interest: { id: string; status: string; note: string; from: string }[] } }) {
  const { run, busy } = useAct();
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex flex-col">
            <span className="text-base font-medium">Open to backers</span>
            <span className="text-sm text-fg-muted">{data.openToBackers ? "Backers on SELF can read your updates." : "Off: nobody sees your updates."}</span>
          </span>
          <Switch label="Open to backers" checked={data.openToBackers} disabled={busy} onCheckedChange={(v) => run(() => capitalOpen(v))} />
        </div>
        {data.followers.length > 0 && <p className="text-sm text-fg-muted">Following your updates: {data.followers.join(", ")}</p>}
      </Card>
      <Card lift className="flex flex-col gap-3 p-6">
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="What moved: something shipped, learned or decided. No amounts, valuations or terms." aria-label="Share an update" />
        <Button variant="primary" size="sm" className="self-start" disabled={busy || text.trim().length < 20} onClick={() => run(() => capitalUpdate(text), "Shared with backers.", () => setText(""))}>
          Share with backers
        </Button>
      </Card>
      {data.interest.map((i) => (
        <Card key={i.id} className="flex flex-col gap-1 px-5 py-4">
          <span className="text-base font-medium">
            {i.from} {i.status === "PENDING" ? "is interested. Answer in Network → Connections." : "· you're talking"}
          </span>
          <span className="text-sm text-fg-muted">{i.note}</span>
        </Card>
      ))}
      {data.updates.length > 0 && <Eyebrow>Your updates</Eyebrow>}
      {data.updates.map((u) => (
        <div key={u.id} className="group flex flex-col gap-0.5">
          <p className="text-base">{u.text}</p>
          <span className="flex gap-3 text-xs text-fg-subtle">
            {timeAgo(new Date(u.at))}
            <button type="button" className="hidden hover:text-danger group-hover:inline" onClick={() => run(() => capitalDeleteUpdate(u.id))}>
              Delete
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

type Founder = { id: string; name: string; headline: string | null; company: { name: string; oneLiner: string | null } | null; following: boolean; interest: string; updates: Update[] };

export function BackerList({ founders }: { founders: Founder[] }) {
  return (
    <div className="flex flex-col gap-4">
      {founders.length === 0 && <p className="text-md text-fg-subtle">No founders are sharing updates with backers right now.</p>}
      {founders.map((f) => (
        <FounderCard key={f.id} f={f} />
      ))}
    </div>
  );
}

function FounderCard({ f }: { f: Founder }) {
  const { run, busy } = useAct();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const first = f.name.split(" ")[0];
  return (
    <Card className="flex flex-col gap-3 px-6 py-5">
      <span className="flex items-center gap-3">
        <Avatar name={f.name} size="lg" />
        <span className="flex flex-col">
          <span className="text-base font-medium">{f.company ? `${f.name} · ${f.company.name}` : f.name}</span>
          <span className="text-sm text-fg-muted">{f.company?.oneLiner ?? f.headline}</span>
        </span>
      </span>
      {f.updates.map((u) => (
        <div key={u.id} className="flex flex-col gap-0.5">
          <p className="text-base">{u.text}</p>
          <span className="text-xs text-fg-subtle">{timeAgo(new Date(u.at))}</span>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs" variant={f.following ? "ghost" : "secondary"} disabled={busy} onClick={() => run(() => capitalFollow(f.id, !f.following))}>
          {f.following ? "Following" : "Follow updates"}
        </Button>
        {f.interest === "none" || f.interest === "not now" ? (
          !open && (
            <Button size="xs" onClick={() => setOpen(true)}>
              I&apos;m interested
            </Button>
          )
        ) : (
          <span className="text-sm text-fg-subtle">{f.interest === "yes" ? `You and ${first} are talking.` : "Interest sent · waiting for an answer"}</span>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-2">
          <Textarea rows={2} autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="What caught your eye, and what you could bring besides money. No amounts or terms." aria-label="Why you're interested" />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" disabled={busy || note.trim().length < 20} onClick={() => run(() => capitalInterest(f.id, note), `Sent to ${first}.`, () => setOpen(false))}>
              Send
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
