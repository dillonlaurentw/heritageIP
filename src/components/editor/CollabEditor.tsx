"use client";

import { BlockNoteEditor, type Block } from "@blocknote/core";
import { blocksToYDoc } from "@blocknote/core/yjs";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { Spinner } from "@/components/ui/Spinner";
import { TAG_COLORS } from "@/components/ui/Tag";
import { connect, FRAGMENT, type HttpProvider, type Peer } from "./collab";
import Editor, { type EditorProps } from "./Editor";
import { schema } from "./schema";

/** A person's cursor colour: stable per person, from the tag palette tokens. */
export function colorFor(userId: string) {
  let h = 0;
  for (const c of userId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const palette = TAG_COLORS.filter((c) => c !== "gray" && c !== "brown");
  return `var(--tag-${palette[h % palette.length]}-fg)`;
}

/** The saved JSON as a first Yjs state, used only if nobody has opened the page live yet. */
function seedFrom(content: unknown[] | null) {
  const headless = BlockNoteEditor.create({ schema });
  const blocks = (content && content.length ? content : []) as Block[];
  return Y.encodeStateAsUpdate(blocksToYDoc(headless as never, blocks as never, FRAGMENT));
}

/**
 * The page editor with live co-editing: connects to the page's shared
 * document, then mounts the editor on it with cursors and presence. Falls
 * back to the plain editor if live editing isn't available.
 */
export default function CollabEditor({ me, onPeers, ...props }: EditorProps & { me: { id: string; name: string }; onPeers?: (peers: Peer[]) => void }) {
  const [conn, setConn] = useState<{ doc: Y.Doc; provider: HttpProvider } | "fallback" | null>(null);

  useEffect(() => {
    let alive = true;
    let live: { provider: HttpProvider } | null = null;
    connect(props.pageId, () => seedFrom(props.initialContent), me.id, {
      onPeers,
      // Someone restored a version (or the server rewrote the page): start again from it.
      onStale: () => window.location.reload(),
    })
      .then((c) => {
        if (!alive) return c?.provider.destroy();
        live = c;
        setConn(c ?? "fallback");
      })
      .catch(() => alive && setConn("fallback"));
    return () => {
      alive = false;
      live?.provider.destroy();
      onPeers?.([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one connection per page
  }, [props.pageId]);

  if (conn === null) {
    return (
      <div className="flex h-24 items-center gap-2 text-sm text-fg-subtle">
        <Spinner /> Opening…
      </div>
    );
  }
  if (conn === "fallback") return <Editor {...props} />;
  return <Editor {...props} collab={{ doc: conn.doc, provider: conn.provider, user: { name: me.name, color: colorFor(me.id) } }} />;
}
