import { z } from "zod";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { follow } from "@/lib/app/capital";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ on: z.boolean() }));
  if (!b) return fail("Follow or unfollow?");
  return result(await follow(viewer, (await ctx.params).id, b.on));
}
