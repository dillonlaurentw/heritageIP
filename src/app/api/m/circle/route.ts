import { z } from "zod";
import { loadCircle, postToCircle } from "@/lib/app/circles";
import { appViewer, body, fail, ok, result } from "@/lib/app/http";

/** Your circle: members, the conversation, this week's catch-up. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ me: viewer.user.id, circle: await loadCircle(viewer.user.id) });
}

/** Say something to your circle. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ text: z.string().max(4000) }));
  if (!b) return fail("Write something first.");
  return result(await postToCircle(viewer.user.id, b.text));
}
