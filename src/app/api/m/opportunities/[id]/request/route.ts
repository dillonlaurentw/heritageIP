import { z } from "zod";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { requestSeat, withdrawSeat } from "@/lib/app/opportunities";

/** "I'd like to come", with one line on why. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ why: z.string().max(1000) }));
  if (!b) return fail("Say why you'd like to come.");
  return result(await requestSeat(viewer, (await ctx.params).id, b.why));
}

/** Withdraw your request (or your seat). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return result(await withdrawSeat(viewer, (await ctx.params).id));
}
