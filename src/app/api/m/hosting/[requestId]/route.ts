import { z } from "zod";
import { appViewer, body, fail, ok } from "@/lib/app/http";
import { answerSeat } from "@/lib/app/opportunities";

/** Host: pick someone, or not this time. */
export async function POST(req: Request, ctx: { params: Promise<{ requestId: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ answer: z.enum(["pick", "not this time"]) }));
  if (!b) return fail("Pick or not this time.");
  const r = await answerSeat(viewer, (await ctx.params).requestId, b.answer === "pick");
  return r.ok ? ok(r) : fail(r.message);
}
