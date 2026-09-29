import { z } from "zod";
import { redeemInvite } from "@/lib/app/access";
import { appViewer, body, fail, result } from "@/lib/app/http";

export async function POST(req: Request) {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const b = await body(req, z.object({ code: z.string().max(40) }));
  if (!b) return fail("Enter your code.");
  return result(await redeemInvite(viewer.user.id, b.code));
}
