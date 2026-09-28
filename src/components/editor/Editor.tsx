"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/ariakit/style.css";
import "./editor.css";
import { BlockNoteView } from "@blocknote/ariakit";
import type { Block } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import {
  type DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { useEffect, useRef } from "react";
import { savePage, uploadImage } from "@/app/actions/pages";
import { schema, type SelfEditor } from "./schema";
import { useEffectiveTheme } from "./useEffectiveTheme";

export type SaveState = "idle" | "saving" | "saved" | "error";
export type Person = { id: string; name: string };

const SAVE_DELAY = 700;

/**
 * The page editor. Autosaves the document (debounced) through `savePage`.
 * `onReady` hands the editor to page-level tools (AI, templates).
 */
export default function Editor({
  pageId,
  initialContent,
  editable,
  people = [],
  onSaveState,
  onReady,
  onMention,
  extraSlashItems,
}: {
  pageId: string;
  initialContent: unknown[] | null;
  editable: boolean;
  people?: Person[];
  onSaveState?: (s: SaveState) => void;
  onReady?: (editor: SelfEditor) => void;
  /** Called with the ids of people newly @mentioned after a save. */
  onMention?: (userIds: string[]) => void;
  extraSlashItems?: (editor: SelfEditor) => DefaultReactSuggestionItem[];
}) {
  const theme = useEffectiveTheme();
  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent && initialContent.length > 0 ? (initialContent as Block[]) : undefined,
    uploadFile: async (file: File) => {
      const form = new FormData();
      form.set("file", file);
      const res = await uploadImage(form);
      if (!res.ok) throw new Error(res.message);
      return res.url;
    },
  }) as unknown as SelfEditor;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const mentioned = useRef<Set<string>>(new Set(mentionIds(initialContent)));

  const flush = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    onSaveState?.("saving");
    const doc = editor.document;
    const res = await savePage(pageId, { content: doc as unknown[] });
    onSaveState?.(res.ok ? "saved" : "error");
    if (res.ok && onMention) {
      const now = mentionIds(doc);
      const fresh = now.filter((id) => !mentioned.current.has(id));
      mentioned.current = new Set(now);
      if (fresh.length) onMention(fresh);
    }
  };

  useEffect(() => {
    onReady?.(editor);
    const save = () => void flush();
    window.addEventListener("beforeunload", save);
    return () => {
      window.removeEventListener("beforeunload", save);
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per editor
  }, [editor]);

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme={theme}
      slashMenu={false}
      className="self-editor -mx-[54px]"
      onChange={() => {
        if (!editable) return;
        dirty.current = true;
        onSaveState?.("saving");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), SAVE_DELAY);
      }}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          filterSuggestionItems([...(extraSlashItems?.(editor) ?? []), ...getDefaultReactSlashMenuItems(editor)], query)
        }
      />
      {people.length > 0 && (
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={async (query) =>
            filterSuggestionItems(
              people.map((p) => ({
                title: p.name,
                group: "People",
                onItemClick: () => {
                  editor.insertInlineContent([{ type: "mention", props: { userId: p.id, name: p.name } }, " "]);
                },
              })),
              query,
            )
          }
        />
      )}
    </BlockNoteView>
  );
}

function mentionIds(doc: unknown): string[] {
  const out = new Set<string>();
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown>;
    if (o.type === "mention") {
      const id = (o.props as Record<string, unknown> | undefined)?.userId;
      if (typeof id === "string" && id) out.add(id);
    }
    for (const k of ["content", "children"]) if (k in o) walk(o[k]);
  };
  walk(doc);
  return [...out];
}
