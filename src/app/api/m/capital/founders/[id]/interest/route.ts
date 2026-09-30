import { z } from "zod";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { sendInterest } from "@/lib/app/capital";

/** Backers: "I'm interested", with a note. No amounts or terms. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ note: z.string().max(2000) }));
  if (!b) return fail("Write a note first.");
  return result(await sendInterest(viewer, (await ctx.params).id, b.note));
}
