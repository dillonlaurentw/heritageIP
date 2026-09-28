"use client";

import { useEffect, useState, useTransition } from "react";
import { listVersions, restoreVersion } from "@/app/actions/pages";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { blocksToText } from "@/lib/blocks";
import { cn } from "@/lib/cn";
import { formatDate, timeAgo } from "@/lib/time";

type Version = Awaited<ReturnType<typeof listVersions>>[number];

/** Snapshots of a page, with a preview and one-click restore. */
export function VersionHistory({
  pageId,
  open,
  onOpenChange,
  editable,
}: {
  pageId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editable: boolean;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void listVersions(pageId).then((v) => {
      if (!alive) return;
      setVersions(v);
      setSelected(v[0]?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, [open, pageId]);

  const current = versions?.find((v) => v.id === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Version history" className="w-[48rem]">
      <div className="grid h-[26rem] grid-cols-[14rem_1fr] gap-0 border-t border-border mt-4">
        <ul className="scroll-quiet overflow-y-auto border-r border-border p-2">
          {versions === null && <Spinner className="m-3" />}
          {versions?.length === 0 && <li className="p-3 text-sm text-fg-muted">No earlier versions yet. SELF saves one every 10 minutes while you edit.</li>}
          {versions?.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setSelected(v.id)}
                className={cn("w-full rounded-md px-2 py-1.5 text-left hover:bg-bg-hover", selected === v.id && "bg-bg-active")}
              >
                <span className="block text-sm font-medium">{formatDate(v.at, true)}</span>
                <span className="block text-xs text-fg-muted">
                  {timeAgo(v.at)} · {v.by}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 flex-col">
          <div className="scroll-quiet flex-1 overflow-y-auto p-5">
            {current && (
              <>
                <p className="text-xl font-semibold">{current.title || "Untitled"}</p>
                <p className="mt-3 text-base whitespace-pre-wrap text-fg-muted">{blocksToText(current.content) || "Empty page."}</p>
              </>
            )}
          </div>
          {current && editable && (
            <div className="flex justify-end border-t border-border p-3">
              <Button
                variant="primary"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await restoreVersion(current.id);
                    if (!res.ok) toast(res.message, "danger");
                    else window.location.reload();
                  })
                }
              >
                Restore this version
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
