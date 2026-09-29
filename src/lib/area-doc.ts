/**
 * An area's page is ordinary blocks: an H2 per section followed by its text.
 * These pure helpers read sections back (so edits made on the page count)
 * and replace one section's text. Tested in __tests__/area-doc.test.ts.
 */
import { B, blocksToText } from "./blocks";

type AnyBlock = { type?: string; props?: { level?: number }; content?: unknown };

const isH2 = (b: AnyBlock) => b.type === "heading" && (b.props?.level ?? 1) === 2;
const norm = (s: string) => s.trim().toLowerCase();

/** Section title → its text, for the titles given. Missing sections come back "". */
export function readSections(doc: unknown, titles: string[]): Record<string, string> {
  const blocks = (Array.isArray(doc) ? doc : []) as AnyBlock[];
  const out: Record<string, string> = Object.fromEntries(titles.map((t) => [t, ""]));
  const wanted = new Map(titles.map((t) => [norm(t), t]));
  let current: string | null = null;
  const parts: Record<string, string[]> = {};
  for (const b of blocks) {
    if (isH2(b)) {
      current = wanted.get(norm(blocksToText(b.content))) ?? null;
      continue;
    }
    if (!current) continue;
    const text = blocksToText(b.content).trim();
    if (!text) continue;
    (parts[current] ??= []).push(b.type === "bulletListItem" ? `- ${text}` : b.type === "numberedListItem" ? `- ${text}` : text);
  }
  for (const [t, lines] of Object.entries(parts)) out[t] = lines.join("\n");
  return out;
}

/** Plain text with "- " lines → blocks: bullets for dashed lines, paragraphs otherwise. */
export function textToSectionBlocks(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/^[-*•]\s+/.test(l) ? B.bullet(l.replace(/^[-*•]\s+/, "")) : /^\d+[.)]\s+/.test(l) ? B.bullet(l.replace(/^\d+[.)]\s+/, "")) : B.p(l)));
}

/**
 * Replaces one section's body, keeping every other block as it is. A section
 * that doesn't exist yet is added in the order of `titles`.
 */
export function writeSection(doc: unknown, titles: string[], title: string, text: string): unknown[] {
  const blocks = (Array.isArray(doc) ? [...doc] : []) as AnyBlock[];
  const body = textToSectionBlocks(text);
  const start = blocks.findIndex((b) => isH2(b) && norm(blocksToText(b.content)) === norm(title));
  if (start >= 0) {
    let end = start + 1;
    while (end < blocks.length && !isH2(blocks[end]!)) end++;
    return [...blocks.slice(0, start + 1), ...body, ...blocks.slice(end)];
  }
  // Insert before the first later section that exists, else at the end.
  const order = titles.map(norm);
  const mine = order.indexOf(norm(title));
  const later = blocks.findIndex((b) => isH2(b) && order.indexOf(norm(blocksToText(b.content))) > mine);
  const at = later >= 0 ? later : blocks.length;
  return [...blocks.slice(0, at), B.h2(title), ...body, ...blocks.slice(at)];
}
