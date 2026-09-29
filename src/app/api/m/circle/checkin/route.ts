import { z } from "zod";
import { saveCheckIn } from "@/lib/app/circles";
import { appViewer, body, fail, result } from "@/lib/app/http";

export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ did: z.string().max(2000), stuck: z.string().max(2000), need: z.string().max(2000) }));
  if (!b) return fail("Check your answers.");
  return result(await saveCheckIn(viewer.user.id, b));
}
