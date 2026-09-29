import { z } from "zod";
import { appViewer, body, fail, ok, result } from "@/lib/app/http";
import { loadThread, sendMessage } from "@/lib/messages";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const t = await loadThread(viewer, (await ctx.params).id);
  if (!t) return fail("Not found.", 404);
  return ok({
    me: viewer.user.id,
    other: t.other ? { id: t.other.id, name: t.other.name, headline: t.other.profile?.headline ?? null } : null,
    messages: t.messages.map((m) => ({ id: m.id, authorId: m.authorId, kind: m.kind, text: m.text, at: m.createdAt.toISOString() })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ text: z.string().max(8000) }));
  if (!b) return fail("Write something first.");
  return result(await sendMessage(viewer, (await ctx.params).id, b.text));
}
