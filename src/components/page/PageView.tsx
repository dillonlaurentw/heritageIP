"use client";

import { Check, Copy, Database, History, Link2, Maximize2, MessageSquare, MoreHorizontal, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { notifyMentions } from "@/app/actions/comments";
import { CommentsPanel, type CommentAnchor } from "@/components/comments/CommentsPanel";
import { newDatabase } from "@/app/actions/databases";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  archivePageAction,
  deleteForeverAction,
  duplicatePageAction,
  newPage,
  restorePageAction,
  savePage,
} from "@/app/actions/pages";
import { AskAIPanel, type AskTarget } from "@/components/ai/AskAIPanel";
import type { EditorProps, SaveState } from "@/components/editor/Editor";
import type { Peer } from "@/components/editor/collab";
import { LazyCollabEditor, LazyEditor } from "@/components/editor/LazyEditor";
import type { SelfEditor } from "@/components/editor/schema";
import { Topbar, type Crumb } from "@/components/shell/Topbar";
import { AvatarStack } from "@/components/ui/Avatar";
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
  /** Comments: who's looking, how many open threads, and a thread to open (from ?comment=). */
  comments?: { me: string; canManage: boolean; open: number; focus?: string | null };
  /** Live co-editing: who you are to the others on this page. Off for databases. */
  live?: { id: string; name: string };
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
  const [ask, setAsk] = useState<{ editor: SelfEditor | null; target: AskTarget | null; n: number } | null>(null);
  const canAsk = p.editable && !p.hideEditor && !p.page.archived;

  /** Open Ask AI on whatever is selected in the editor (or nothing). */
  const openAsk = () => {
    const editor = editorRef.current;
    const blocks = editor?.getSelection()?.blocks ?? [];
    const target = editor && blocks.length ? { blockIds: blocks.map((b) => b.id), markdown: editor.blocksToMarkdownLossy(blocks) } : null;
    setAsk((a) => ({ editor, target, n: (a?.n ?? 0) + 1 }));
  };

  // ⌘J opens Ask AI, like other editors.
  useEffect(() => {
    if (!canAsk) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        openAsk();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canAsk]);

  // Comments: a side sheet. Opening from the selection toolbar anchors the draft to that block.
  const [commentsOpen, setCommentsOpen] = useState(Boolean(p.comments?.focus));
  const [anchor, setAnchor] = useState<CommentAnchor | null>(null);
  const [openCount, setOpenCount] = useState(p.comments?.open ?? 0);
  const [sheetKey, setSheetKey] = useState(0);
  const openComments = (withSelection: boolean) => {
    const editor = editorRef.current;
    const block = withSelection ? editor?.getSelection()?.blocks[0] : undefined;
    const quote = withSelection ? editor?.getSelectedText().trim().slice(0, 280) : "";
    setAnchor(block && quote ? { blockId: block.id, quote } : null);
    setSheetKey((k) => k + 1);
    setCommentsOpen(true);
  };
  const closeComments = useCallback(() => setCommentsOpen(false), []);
  const [peers, setPeers] = useState<Peer[]>([]);
  const onMention = (ids: string[]) => {
    void notifyMentions(p.page.id, ids);
    p.onMention?.(ids);
  };

  const editorProps: EditorProps = {
    pageId: p.page.id,
    initialContent: p.page.content,
    editable: p.editable,
    people: p.people,
    onSaveState: setSave,
    onMention,
    onAskAI: canAsk ? () => openAsk() : undefined,
    onComment: p.comments && !p.page.archived ? () => openComments(true) : undefined,
    onReady: (e) => {
      editorRef.current = e;
      p.onEditorReady?.(e);
    },
    extraSlashItems: p.editable
      ? (editor) => [
          {
            title: "Ask AI",
            subtext: "Draft, summarise, or turn this page into tasks",
            aliases: ["ai", "write", "draft", "self"],
            group: "SELF",
            icon: <Sparkles className="size-4" />,
            onItemClick: () => openAsk(),
          },
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
      : undefined,
  };

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
            {peers.length > 0 && (
              <span className="mr-1 flex items-center" title={`Also here: ${peers.map((x) => x.name).join(", ")}`}>
                <AvatarStack names={peers.map((x) => x.name)} size="sm" />
                <span className="sr-only">Also here: {peers.map((x) => x.name).join(", ")}</span>
              </span>
            )}
            <span className="mr-1 hidden text-xs text-fg-subtle sm:inline" aria-live="polite">
              {save === "saving" ? "Saving…" : save === "saved" ? "Saved" : save === "error" ? "Couldn't save" : ""}
            </span>
            {p.topActions}
            {p.comments && !p.hideEditor && (
              <Button variant="ghost" onClick={() => (commentsOpen ? setCommentsOpen(false) : openComments(false))} aria-pressed={commentsOpen} aria-label={openCount ? `Comments, ${openCount} open` : "Comments"} title="Comments">
                <MessageSquare className="size-3.5" />
                {openCount > 0 ? openCount : <span className="hidden sm:inline">Comment</span>}
              </Button>
            )}
            {canAsk && (
              <Button variant="ghost" onClick={() => openAsk()} title="Ask AI (⌘J)">
                <Sparkles className="size-3.5" /> Ask AI
              </Button>
            )}
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
        widthClass={cn(fullWidth ? "max-w-none" : "max-w-page", commentsOpen && "xl:mr-[24rem]")}
      />
      <article className={cn("mx-auto w-full px-6 pb-40 md:px-12", fullWidth ? "max-w-none" : "max-w-page", commentsOpen && "xl:mr-[24rem]")}>
        {p.aboveEditor}
        {!p.hideEditor && (
          <div className="mt-4">
            {p.live ? (
              <LazyCollabEditor key={p.page.id} {...editorProps} me={p.live} onPeers={setPeers} />
            ) : (
              <LazyEditor key={p.page.id} {...editorProps} />
            )}
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

      {ask && (
        <AskAIPanel
          key={ask.n}
          pageId={p.page.id}
          editor={ask.editor}
          target={ask.target}
          onClose={() => setAsk(null)}
        />
      )}

      {p.comments && commentsOpen && (
        <CommentsPanel
          key={sheetKey}
          pageId={p.page.id}
          me={p.comments.me}
          canManage={p.comments.canManage}
          people={p.people}
          anchor={anchor}
          focusId={p.comments.focus}
          onClose={closeComments}
          onCount={setOpenCount}
        />
      )}

      <VersionHistory pageId={p.page.id} open={historyOpen} onOpenChange={setHistoryOpen} editable={p.editable} />
    </>
  );
}
