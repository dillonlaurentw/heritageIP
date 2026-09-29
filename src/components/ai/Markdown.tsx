import { Fragment, type ReactNode } from "react";

/**
 * A tiny, safe Markdown renderer for agent output: paragraphs, headings,
 * "- " and "1." lists, "[ ]" checklists, **bold**, *italic* and `code`.
 * Builds React nodes; never injects HTML.
 */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let list: { ordered: boolean; items: ReactNode[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{it}</li>);
    blocks.push(list.ordered ? <ol key={blocks.length} className="list-decimal pl-5">{items}</ol> : <ul key={blocks.length} className="list-disc pl-5">{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const check = /^\s*(?:[-*]\s+)?\[( |x)\]\s+(.*)$/i.exec(line);
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push(
        <p key={blocks.length} className="font-semibold">
          {inline(heading[2])}
        </p>,
      );
    } else if (check) {
      flushPara();
      flushList();
      blocks.push(
        <p key={blocks.length} className="flex items-start gap-2">
          <span aria-hidden className="mt-1 inline-block size-3.5 shrink-0 rounded-sm border border-border-strong" />
          <span>{inline(check[2])}</span>
        </p>,
      );
    } else if (bullet || numbered) {
      flushPara();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(inline((bullet ?? numbered)![1]));
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className={className ?? "flex flex-col gap-2"}>{blocks}</div>;
}

function inline(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(p)) return <code key={i} className="rounded-sm bg-bg-subtle px-1 font-mono text-[0.9em]">{p.slice(1, -1)}</code>;
    if (/^\*[^*\s][^*]*\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}
