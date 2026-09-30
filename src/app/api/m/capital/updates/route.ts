import { z } from "zod";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { postUpdate } from "@/lib/app/capital";

/** Share a progress update with backers. No amounts or terms. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ text: z.string().max(2000) }));
  if (!b) return fail("Write an update first.");
  return result(await postUpdate(viewer, b.text));
}
