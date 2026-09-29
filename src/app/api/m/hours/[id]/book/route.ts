import { z } from "zod";
import { bookHour } from "@/lib/app/hours";
import { appViewer, body, fail, result } from "@/lib/app/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ topic: z.string().max(2000) }));
  if (!b) return fail("Say what you want help with.");
  return result(await bookHour({ id: viewer.user.id, name: viewer.user.name }, (await ctx.params).id, b.topic));
}
