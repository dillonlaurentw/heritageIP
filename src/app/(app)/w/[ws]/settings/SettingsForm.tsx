"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteWorkspace, removeMember, updateWorkspace } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { WorkspaceMark } from "@/components/ui/PageIcon";
import { useToast } from "@/components/ui/Toast";

type W = { id: string; name: string; oneLiner: string; icon: string };

export function SettingsForm({ workspace, canManage, isOwner, userId }: { workspace: W; canManage: boolean; isOwner: boolean; userId: string }) {
  const [v, setV] = useState(workspace);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-xl bg-surface shadow-card p-5">
        <div className="flex items-center gap-3">
          <WorkspaceMark name={v.name || "?"} icon={v.icon} size="lg" />
          <div className="text-sm text-fg-muted">The mark shows the first letter, or a character you choose.</div>
        </div>
        <Field label="Name">
          <Input value={v.name} disabled={!canManage} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="One line">
          <Input value={v.oneLiner} disabled={!canManage} onChange={(e) => setV({ ...v, oneLiner: e.target.value })} />
        </Field>
        <Field label="Mark" hint="One character or emoji. Leave empty for the first letter.">
          <Input value={v.icon} maxLength={4} disabled={!canManage} className="w-24" onChange={(e) => setV({ ...v, icon: e.target.value })} />
        </Field>
        {canManage && (
          <div>
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await updateWorkspace(v.id, { name: v.name, oneLiner: v.oneLiner, icon: v.icon });
                  if (res.ok) {
                    toast("Saved");
                    router.refresh();
                  } else toast(res.message, "danger");
                })
              }
            >
              Save
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-danger/30 p-5">
        <h2 className="text-base font-semibold">{isOwner ? "Delete workspace" : "Leave workspace"}</h2>
        <p className="text-sm text-fg-muted">
          {isOwner
            ? "Deletes every page, database and conversation in this workspace for everyone. This can't be undone."
            : "You'll lose access to its pages until someone invites you again."}
        </p>
        <div>
          <Button variant="danger" onClick={() => (isOwner ? setConfirm(true) : start(async () => void (await removeMember(v.id, userId))))}>
            {isOwner ? "Delete workspace" : "Leave"}
          </Button>
        </div>
      </section>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete ${workspace.name}?`}
        description="Type the workspace name to confirm. Everything in it will be gone for good."
      >
        <div className="flex flex-col gap-3 p-5">
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={workspace.name} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={typed !== workspace.name || pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteWorkspace(workspace.id, typed);
                  if (res && !res.ok) toast(res.message, "danger");
                })
              }
            >
              Delete for good
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
