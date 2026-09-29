import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { leave, pull, push } from "@/lib/collab";
import { getViewer } from "@/lib/session";

/*
 * Live co-editing sync. A route handler (not a server action) so pulls and
 * pushes run concurrently with the page's own saves.
 *   GET  ?since=<id>          → updates after that id + presence
 *   POST { epoch, clientId, seed?, update?, awareness?, compact? }
 *   POST { leave: clientId }  → drop presence
 */

const b64 = z.string().max(4_000_000);
const pushInput = z.object({
  epoch: z.number().int().min(0),
  clientId: z.string().min(1).max(40),
  seed: b64.optional(),
  update: b64.optional(),
  awareness: z.string().max(20_000).optional(),
  compact: z.object({ upTo: z.number().int().positive(), state: b64 }).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ pageId: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const since = Number(req.nextUrl.searchParams.get("since") ?? 0) || 0;
  const res = await pull((await ctx.params).pageId, viewer, since);
  if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ pageId: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const pageId = (await ctx.params).pageId;
  const body = await req.json().catch(() => null);
  if (body && typeof body.leave === "string") {
    await leave(pageId, viewer, body.leave.slice(0, 40));
    return NextResponse.json({ ok: true });
  }
  const parsed = pushInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const res = await push(pageId, viewer, parsed.data);
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: res.status });
  return NextResponse.json(res);
}
