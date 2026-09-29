import { z } from "zod";
import { appViewer, body, fail, ok } from "@/lib/app/http";
import { answerRequest } from "@/lib/app/mentors";

/** Yes (opens a conversation) or not now. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ answer: z.enum(["yes", "not now"]) }));
  if (!b) return fail("Say yes or not now.");
  const r = await answerRequest(viewer, (await ctx.params).id, b.answer === "yes");
  return r.ok ? ok(r) : fail(r.message);
}
