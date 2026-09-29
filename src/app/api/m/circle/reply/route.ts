import { z } from "zod";
import { replyToCheckIn } from "@/lib/app/circles";
import { appViewer, body, fail, result } from "@/lib/app/http";

export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ checkInId: z.string().max(64), text: z.string().max(2000) }));
  if (!b) return fail("Write a reply first.");
  return result(await replyToCheckIn({ id: viewer.user.id, name: viewer.user.name }, b.checkInId, b.text));
}
