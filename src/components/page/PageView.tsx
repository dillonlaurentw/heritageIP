"use client";

import { Check, Copy, Database, History, Link2, Maximize2, MoreHorizontal, Plus, RotateCcw, Trash2 } from "lucide-react";
import { newDatabase } from "@/app/actions/databases";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  archivePageAction,
  deleteForeverAction,
  duplicatePageAction,
  newPage,
  restorePageAction,
  savePage,
} from "@/app/actions/pages";
import type { SaveState } from "@/components/editor/Editor";
import { LazyEditor } from "@/components/editor/LazyEditor";
import type { SelfEditor } from "@/components/editor/schema";
import { Topbar, type Crumb } from "@/components/shell/Topbar";
import { Button } from "@/components/ui/Button";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { PageIcon } from "@/components/ui/PageIcon";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { PageHeader } from "./PageHeader";
import { VersionHistory } from "./VersionHistory";

export type PageViewProps = {
  page: {
    id: string;
    title: string;
    icon: string | null;
    coverUrl: string | null;
    content: unknown[] | null;
    fullWidth: boolean;
    archived: boolean;
    workspaceId: string;
    systemKey: string | null;
  };
  crumbs: Crumb[];
  editable: boolean;
  canDeleteForever: boolean;
  childPages: { id: string; title: string; icon: string | null; href: string }[];
  people: { id: string; name: string }[];
  /** Extra buttons in the top bar (comments, AI…). */
  topActions?: ReactNode;
  /** Rendered between the title and the editor (row properties, banners). */
  aboveEditor?: ReactNode;
  /** Rendered under the editor. */
  belowEditor?: ReactNode;
  onEditorReady?: (editor: SelfEditor) => void;
  onMention?: (userIds: string[]) => void;
  titlePlaceholder?: string;
  hideEditor?: boolean;
  /** Databases use the full width of the screen. */
  wide?: boolean;
  hideChildren?: boolean;
};

/** A page: header, body, pages inside it, and page-level actions. */
export function PageView(p: PageViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [save, setSave] = useState<SaveState>("idle");
  const [fullWidthPref, setFullWidth] = useState(p.page.fullWidth);
  const fullWidth = fullWidthPref || Boolean(p.wide);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [title, setTitle] = useState(p.page.title);
  const editorRef = useRef<SelfEditor | null>(null);

  const crumbs = [...p.crumbs.slice(0, -1), { label: title || "Untitled", icon: p.page.icon }];

  const act = async (fn: () => Promise<{ ok: boolean; message?: string; href?: string }>, done?: string) => {
    const res = await fn();
    if (!res.ok) toast(res.message ?? "Couldn't do that.", "danger");
    else {
      if (done) toast(done);
      if (res.href) router.push(res.href as Route);
      else router.refresh();
    }
  };

  return (
    <>
      <Topbar
        crumbs={crumbs}
        actions={
          <>
            <span className="mr-1 hidden text-xs text-fg-subtle sm:inline" aria-live="polite">
              {save === "saving" ? "Saving…" : save === "saved" ? "Saved" : save === "error" ? "Couldn't save" : ""}
            </span>
            {p.topActions}
            <Menu
              align="end"
              className="w-60"
              trigger={
                <Button iconOnly variant="ghost" aria-label="Page options">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            >
              <MenuItem
                icon={<Link2 />}
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  toast("Link copied");
                }}
              >
                Copy link
              </MenuItem>
              {p.editable && !p.wide && (
                <MenuItem
                  icon={fullWidth ? <Check /> : <Maximize2 />}
                  onClick={() => {
                    setFullWidth(!fullWidthPref);
                    void savePage(p.page.id, { fullWidth: !fullWidthPref });
                  }}
                >
                  Full width
                </MenuItem>
              )}
              <MenuItem icon={<History />} onClick={() => setHistoryOpen(true)}>
                Version history
              </MenuItem>
              {p.editable && (
                <>
                  <MenuItem icon={<Copy />} onClick={() => void act(() => duplicatePageAction(p.page.id))}>
                    Duplicate
                  </MenuItem>
                  {p.page.systemKey !== "home" && (
                    <>
                      <MenuSeparator />
                      <MenuItem icon={<Trash2 />} danger onClick={() => void act(() => archivePageAction(p.page.id), "Moved to trash")}>
                        Move to trash
                      </MenuItem>
                    </>
                  )}
                </>
              )}
            </Menu>
          </>
        }
      />

      {p.page.archived && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-danger-soft px-4 py-2 text-sm">
          <span>This page is in the trash.</span>
          <Button size="xs" onClick={() => void act(() => restorePageAction(p.page.id), "Restored")}>
            <RotateCcw className="size-3.5" /> Restore
          </Button>
          {p.canDeleteForever && (
            <Button size="xs" variant="danger" onClick={() => void act(() => deleteForeverAction(p.page.id), "Deleted")}>
              Delete for good
            </Button>
          )}
        </div>
      )}

      <PageHeader
        pageId={p.page.id}
        title={p.page.title}
        icon={p.page.icon}
        cover={p.page.coverUrl}
        editable={p.editable}
        placeholder={p.titlePlaceholder}
        onTitleChange={setTitle}
        onEnter={() => editorRef.current?.focus()}
        widthClass={fullWidth ? "max-w-none" : "max-w-page"}
      />
      <article className={cn("mx-auto w-full px-6 pb-40 md:px-12", fullWidth ? "max-w-none" : "max-w-page")}>
        {p.aboveEditor}
        {!p.hideEditor && (
          <div className="mt-4">
            <LazyEditor
              key={p.page.id}
              pageId={p.page.id}
              initialContent={p.page.content}
              editable={p.editable}
              people={p.people}
              onSaveState={setSave}
              onMention={p.onMention}
              onReady={(e) => {
                editorRef.current = e;
                p.onEditorReady?.(e);
              }}
              extraSlashItems={
                p.editable
                  ? (editor) => [
                      {
                        title: "Database",
                        subtext: "A table, board, list or calendar inside this page",
                        aliases: ["table", "board", "db", "calendar", "list"],
                        group: "Advanced",
                        icon: <Database className="size-4" />,
                        onItemClick: async () => {
                          const res = await newDatabase(p.page.workspaceId, p.page.id);
                          if (!res.ok) return toast(res.message, "danger");
                          const at = editor.getTextCursorPosition().block;
                          editor.insertBlocks([{ type: "database", props: { databaseId: res.id } }], at, "after");
                          router.refresh();
                        },
                      },
                    ]
                  : undefined
              }
            />
          </div>
        )}
        {p.belowEditor}
        {!p.hideChildren && (p.childPages.length > 0 || p.editable) && !p.page.archived && (
          <section className="mt-12 border-t border-border pt-4">
            {p.childPages.length > 0 && <h2 className="mb-1 text-xs font-medium text-fg-subtle">Pages inside</h2>}
            <ul className="flex flex-col">
              {p.childPages.map((c) => (
                <li key={c.id}>
                  <Link href={c.href as Route} className="flex h-8 items-center gap-2 rounded-md px-1.5 text-base hover:bg-bg-hover">
                    <PageIcon icon={c.icon} />
                    <span className="truncate underline decoration-border underline-offset-4">{c.title || "Untitled"}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {p.editable && (
              <button
                type="button"
                onClick={() => void act(() => newPage(p.page.workspaceId, p.page.id))}
                className="mt-1 flex h-8 items-center gap-2 rounded-md px-1.5 text-sm text-fg-subtle hover:bg-bg-hover hover:text-fg"
              >
                <Plus className="size-4" /> Add a page inside
              </button>
            )}
          </section>
        )}
      </article>

      <VersionHistory pageId={p.page.id} open={historyOpen} onOpenChange={setHistoryOpen} editable={p.editable} />
    </>
  );
}
