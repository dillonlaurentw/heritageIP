"use client";

import { Copy, MoreHorizontal, UserPlus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeMemberRole, inviteMembers, removeMember, revokeInvite, setMemberTitle } from "@/app/actions/workspaces";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { formatDate, timeAgo } from "@/lib/time";
import { canChangeRole, canRemove, ROLE_HINT, ROLE_LABEL, type WorkspaceRole } from "@/lib/workspace-rules";

type Member = {
  id: string;
  name: string;
  email: string | null;
  headline: string | null;
  focusAreas: string[];
  openTasks: number;
  role: WorkspaceRole;
  title: string | null;
  joinedAt: string;
};
type InviteRow = { id: string; email: string; role: WorkspaceRole; createdAt: string; expired: boolean };

export function PeopleManager(p: {
  workspaceId: string;
  me: { id: string; role: WorkspaceRole };
  canInvite: boolean;
  invitable: WorkspaceRole[];
  openInvite: boolean;
  members: Member[];
  invites: InviteRow[];
  tasksHref: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(p.openInvite);
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<WorkspaceRole>(p.invitable.includes("MEMBER") ? "MEMBER" : p.invitable[0] ?? "MEMBER");
  const [links, setLinks] = useState<{ email: string; url: string }[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message?: string } | void>, done?: string) =>
    start(async () => {
      const res = await fn();
      if (res && !res.ok) toast(res.message ?? "Couldn't do that.", "danger");
      else {
        if (done) toast(done);
        router.refresh();
      }
    });

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg-muted">
            {p.members.length} {p.members.length === 1 ? "person" : "people"}
          </h2>
          {p.canInvite && (
            <Button variant="primary" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" /> Invite people
            </Button>
          )}
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          {p.members.map((m) => {
            const self = m.id === p.me.id;
            const changeable = (["ADMIN", "MEMBER", "GUEST"] as WorkspaceRole[]).filter(
              (r) => r !== m.role && canChangeRole(p.me.role, m.role, r, self),
            );
            const removable = canRemove(p.me.role, m.role, self);
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <Avatar name={m.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">
                    {m.name} {self && <span className="text-sm font-normal text-fg-subtle">(you)</span>}
                  </p>
                  {editingTitle === m.id ? (
                    <Input
                      autoFocus
                      defaultValue={m.title ?? ""}
                      placeholder="Co-founder, operations"
                      className="mt-1 h-7 max-w-xs text-sm"
                      onBlur={(e) => {
                        setEditingTitle(null);
                        if (e.target.value !== (m.title ?? "")) run(() => setMemberTitle(p.workspaceId, m.id, e.target.value));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingTitle(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={!(self || p.canInvite)}
                      onClick={() => setEditingTitle(m.id)}
                      className="block max-w-full truncate text-left text-sm text-fg-muted enabled:hover:text-fg"
                    >
                      {m.title || m.headline || (self || p.canInvite ? "Add a title" : "")}
                    </button>
                  )}
                  {m.email && <p className="truncate text-xs text-fg-subtle">{m.email}</p>}
                  {m.focusAreas.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.focusAreas.slice(0, 5).map((f) => (
                        <Tag key={f}>{f}</Tag>
                      ))}
                    </div>
                  )}
                </div>
                {p.tasksHref && m.openTasks > 0 && (
                  <Link href={p.tasksHref as Route} className="hidden text-xs text-fg-muted hover:text-fg hover:underline sm:inline">
                    {m.openTasks} open {m.openTasks === 1 ? "task" : "tasks"}
                  </Link>
                )}
                <span className="hidden text-xs text-fg-subtle sm:inline">Joined {formatDate(m.joinedAt, true)}</span>
                <Tag color={m.role === "OWNER" ? "orange" : m.role === "ADMIN" ? "purple" : m.role === "GUEST" ? "gray" : "blue"}>
                  {ROLE_LABEL[m.role]}
                </Tag>
                {(changeable.length > 0 || removable) && (
                  <Menu
                    align="end"
                    trigger={
                      <Button iconOnly variant="ghost" aria-label={`Manage ${m.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  >
                    {changeable.map((r) => (
                      <MenuItem key={r} onClick={() => run(() => changeMemberRole(p.workspaceId, m.id, r), `${m.name} is now ${ROLE_LABEL[r].toLowerCase()}`)}>
                        Make {ROLE_LABEL[r].toLowerCase()}
                      </MenuItem>
                    ))}
                    {removable && (
                      <MenuItem danger onClick={() => run(() => removeMember(p.workspaceId, m.id), self ? undefined : "Removed")}>
                        {self ? "Leave workspace" : "Remove from workspace"}
                      </MenuItem>
                    )}
                  </Menu>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {p.canInvite && p.invites.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Invited</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            {p.invites.map((i) => (
              <div key={i.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                <span className="min-w-0 flex-1 truncate text-base">{i.email}</span>
                <span className="text-xs text-fg-subtle">{i.expired ? "Expired" : `Sent ${timeAgo(i.createdAt)}`}</span>
                <Tag>{ROLE_LABEL[i.role]}</Tag>
                <Button variant="ghost" size="xs" onClick={() => run(() => revokeInvite(i.id), "Invite withdrawn")}>
                  Withdraw
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog
        open={inviteOpen}
        onOpenChange={(o) => {
          setInviteOpen(o);
          if (!o) setLinks([]);
        }}
        title="Invite people"
        description="They'll get an email with a link to join. Invites last 14 days."
      >
        <div className="flex flex-col gap-4 p-5">
          {links.length > 0 ? (
            <>
              <p className="text-sm text-fg-muted">Sent. If email isn&apos;t set up yet, share these links yourself:</p>
              {links.map((l) => (
                <div key={l.email} className="flex items-center gap-2 rounded-md bg-bg-inset px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{l.email}</span>
                  <Button
                    size="xs"
                    onClick={() => {
                      void navigator.clipboard.writeText(l.url);
                      toast("Link copied");
                    }}
                  >
                    <Copy className="size-3.5" /> Copy link
                  </Button>
                </div>
              ))}
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setInviteOpen(false)}>
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <Field label="Emails" hint="Separate several with commas or new lines.">
                <Textarea autoFocus rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="dev@company.com, ana@company.com" />
              </Field>
              <Field label="Role" hint={ROLE_HINT[role]}>
                <Select value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)}>
                  {p.invitable.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={pending || !emails.trim()}
                  onClick={() =>
                    start(async () => {
                      const res = await inviteMembers(p.workspaceId, emails, role);
                      if (!res.ok) toast(res.message, "danger");
                      else {
                        setLinks(res.links);
                        setEmails("");
                        router.refresh();
                      }
                    })
                  }
                >
                  {pending ? "Sending…" : "Send invites"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
