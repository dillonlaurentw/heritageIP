/**
 * Helpers for BlockNote documents stored as JSON. Pure, so they're unit tested
 * and safe on the server (no editor code here).
 */
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Plain text of a document, for search and previews. */
export function blocksToText(doc: unknown, limit = 20_000): string {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (out.join(" ").length > limit) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if (o.type === "text" && typeof o.text === "string") out.push(o.text);
    if (o.type === "mention" && o.props && typeof (o.props as Record<string, unknown>).name === "string") {
      out.push(`@${(o.props as Record<string, string>).name}`);
    }
    for (const k of ["content", "children", "rows", "cells"]) if (k in o) walk(o[k]);
  };
  walk(doc);
  return out.join(" ").replace(/\s+/g, " ").trim().slice(0, limit);
}

let counter = 0;
const id = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

type Inline = { type: "text"; text: string; styles: Record<string, boolean> };
const t = (text: string, styles: Record<string, boolean> = {}): Inline => ({ type: "text", text, styles });
/** Inline content for a string; empty strings make no text node (the editor rejects empty ones). */
const c = (text: string, styles: Record<string, boolean> = {}): Inline[] => (text ? [t(text, styles)] : []);

/** Build BlockNote blocks on the server (templates, seed data, AI output). */
export const B = {
  p: (text = "", bold = false) => ({ id: id(), type: "paragraph", props: {}, content: c(text, bold ? { bold: true } : {}), children: [] }),
  h1: (text: string) => ({ id: id(), type: "heading", props: { level: 1 }, content: c(text), children: [] }),
  h2: (text: string) => ({ id: id(), type: "heading", props: { level: 2 }, content: c(text), children: [] }),
  h3: (text: string) => ({ id: id(), type: "heading", props: { level: 3 }, content: c(text), children: [] }),
  bullet: (text: string) => ({ id: id(), type: "bulletListItem", props: {}, content: c(text), children: [] }),
  number: (text: string) => ({ id: id(), type: "numberedListItem", props: {}, content: c(text), children: [] }),
  todo: (text: string, checked = false) => ({ id: id(), type: "checkListItem", props: { checked }, content: c(text), children: [] }),
  quote: (text: string) => ({ id: id(), type: "quote", props: {}, content: c(text), children: [] }),
  /** A lead paragraph with a bold label: "Problem. People…" */
  labeled: (label: string, text: string) => ({
    id: id(),
    type: "paragraph",
    props: {},
    content: [...c(`${label} `, { bold: true }), ...c(text)],
    children: [],
  }),
};

/** Paragraph blocks from plain text, one per line; "- " lines become bullets. */
export function textToBlocks(text: string) {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/^[-*•]\s+/.test(l) ? B.bullet(l.replace(/^[-*•]\s+/, "")) : /^\[( |x)\]\s+/i.test(l) ? B.todo(l.slice(4), /^\[x\]/i.test(l)) : B.p(l)));
}

/** Unchecked to-do items in a document, e.g. meeting action items. */
export function openTodos(doc: unknown): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if (o.type === "checkListItem" && !(o.props as Record<string, unknown> | undefined)?.checked) {
      const text = blocksToText(o.content);
      if (text) out.push({ id: String(o.id ?? ""), text });
    }
    if (Array.isArray(o.children)) walk(o.children);
  };
  walk(doc);
  return out;
}
