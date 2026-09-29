"use client";

import { Mail, UserPlus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addCandidateToWorkspace, answerSignal } from "@/app/actions/network";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag, type TagColor } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";

export type ConnectionItem = {
  id: string;
  kind: "ROLE_INTEREST" | "BACKER_INTEREST" | "MENTOR_REQUEST" | "PARTNER_INTRO";
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  received: boolean;
  note: string;
  at: string;
  person: { name: string; headline: string | null };
  workspace: { name: string; slug: string } | null;
  about: string | null;
  aboutHref: string | null;
  partner: { name: string; slug: string; concierge: boolean } | null;
  contact: { email: string | null; link: string | null } | null;
  canAddToWorkspace: boolean;
};

const KIND: Record<ConnectionItem["kind"], { label: string; color: TagColor }> = {
  ROLE_INTEREST: { label: "Role", color: "purple" },
  BACKER_INTEREST: { label: "Backer", color: "green" },
  MENTOR_REQUEST: { label: "Mentor", color: "blue" },
  PARTNER_INTRO: { label: "Intro", color: "orange" },
};
const STATUS: Record<ConnectionItem["status"], { label: string; color: TagColor }> = {
  PENDING: { label: "Waiting", color: "yellow" },
  ACCEPTED: { label: "Connected", color: "green" },
  DECLINED: { label: "Declined", color: "gray" },
  WITHDRAWN: { label: "Withdrawn", color: "gray" },
};

function headline(i: ConnectionItem) {
  const ws = i.workspace?.name ?? "";
  if (i.received) {
    if (i.kind === "ROLE_INTEREST") return `${i.person.name} is interested in “${i.about ?? "a role"}” at ${ws}`;
    if (i.kind === "BACKER_INTEREST") return `${i.person.name}, a backer, is interested in ${ws}`;
    if (i.kind === "MENTOR_REQUEST") return `${i.person.name} (${ws}) asked you to mentor them`;
    return `${i.person.name} (${ws}) asked for an intro to ${i.partner?.name}`;
  }
  if (i.kind === "ROLE_INTEREST") return `You said you're interested in “${i.about ?? "a role"}” at ${ws}`;
  if (i.kind === "BACKER_INTEREST") return `You signalled interest in ${ws}`;
  if (i.kind === "MENTOR_REQUEST") return `You asked ${i.person.name} to mentor you`;
  return `${ws} asked for an intro to ${i.partner?.name}`;
}

export function ConnectionList({ items }: { items: ConnectionItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"received" | "sent">(items.some((i) => i.received && i.status === "PENDING") || !items.some((i) => !i.received) ? "received" : "sent");
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return toast(res.message ?? "Couldn't do that.", "danger");
      toast(done);
      router.refresh();
    });

  const shown = items
    .filter((i) => (tab === "received" ? i.received : !i.received))
    .sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"));
  const waiting = items.filter((i) => i.received && i.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-1 border-b border-border">
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("-mb-px border-b-2 px-2 pb-2 text-sm", tab === t ? "border-fg font-medium" : "border-transparent text-fg-muted hover:text-fg")}
          >
            {t === "received" ? "Received" : "Sent"}
            {t === "received" && waiting > 0 && <span className="ml-1.5 rounded-sm bg-accent px-1 text-2xs font-semibold text-accent-fg">{waiting}</span>}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={tab === "received" ? "Nothing here yet." : "You haven't asked anyone yet."}
          hint="Find co-founders, mentors, partners and backers on the Network."
          action={
            <Link href="/network" className="text-sm font-medium text-accent-text hover:underline">
              Find your people →
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((i) => (
            <li key={i.id} className={cn("rounded-xl bg-surface shadow-card p-4", i.status === "PENDING" && i.received && "border-accent/40")}>
              <div className="flex items-start gap-3">
                <Avatar name={i.person.name} size="md" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag color={KIND[i.kind].color}>{KIND[i.kind].label}</Tag>
                    <Tag color={STATUS[i.status].color}>{STATUS[i.status].label}</Tag>
                    <span className="text-xs text-fg-subtle">{timeAgo(i.at)}</span>
                  </div>
                  <p className="mt-1.5 text-base font-medium">{headline(i)}</p>
                  {i.person.headline && <p className="text-sm text-fg-muted">{i.person.headline}</p>}
                  {i.partner?.concierge && <p className="mt-1 text-xs text-fg-subtle">You&apos;re answering as SELF&apos;s concierge: {i.partner.name} hasn&apos;t claimed their profile.</p>}
                  <p className="mt-2 border-l-2 border-border-strong pl-3 text-sm whitespace-pre-line text-fg-muted">{i.note}</p>
                  {i.about && i.aboutHref && (
                    <Link href={i.aboutHref as Route} className="mt-2 inline-block text-xs text-fg-muted hover:text-fg hover:underline">
                      {i.kind === "ROLE_INTEREST" ? "Role" : "Game-plan step"}: {i.about}
                    </Link>
                  )}

                  {i.status === "ACCEPTED" && i.contact && (i.contact.email || i.contact.link) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-bg-subtle px-3 py-2 text-sm">
                      <Mail className="size-4 text-fg-muted" />
                      {i.contact.email && (
                        <a href={`mailto:${i.contact.email}`} className="font-medium hover:underline">
                          {i.contact.email}
                        </a>
                      )}
                      {i.contact.link && <span className="text-fg-muted">{i.contact.link}</span>}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {i.status === "PENDING" && i.received && (
                      <>
                        <Button variant="primary" disabled={busy} onClick={() => run(() => answerSignal(i.id, "accept"), i.kind === "PARTNER_INTRO" ? "Intro sent to both sides" : "Connected: details swapped")}>
                          {i.kind === "PARTNER_INTRO" ? "Make the intro" : "Accept"}
                        </Button>
                        <Button variant="ghost" disabled={busy} onClick={() => run(() => answerSignal(i.id, "decline"), "Declined")}>
                          Decline
                        </Button>
                      </>
                    )}
                    {i.status === "PENDING" && !i.received && (
                      <Button variant="ghost" disabled={busy} onClick={() => run(() => answerSignal(i.id, "withdraw"), "Withdrawn")}>
                        Withdraw
                      </Button>
                    )}
                    {i.canAddToWorkspace && (
                      <Button disabled={busy} onClick={() => run(() => addCandidateToWorkspace(i.id), `${i.person.name.split(" ")[0]} added to ${i.workspace?.name}`)}>
                        <UserPlus className="size-3.5" /> Add to {i.workspace?.name}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
