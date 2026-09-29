import { z } from "zod";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { askMentor } from "@/lib/app/mentors";

/** Ask for mentorship: a note about what you're building and what you'd like help with. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ note: z.string().max(2000) }));
  if (!b) return fail("Write a note first.");
  return result(await askMentor(viewer, (await ctx.params).id, b.note));
}
