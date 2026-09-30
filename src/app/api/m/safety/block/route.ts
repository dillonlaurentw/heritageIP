import { z } from "zod";
import { appViewer, body, fail, ok, result } from "@/lib/app/http";
import { block, myBlocks, unblock } from "@/lib/app/safety";

/** People you've blocked. */
export async function GET() {
  const { viewer, res } = await appViewer();
  if (res) return res;
  return ok({ blocked: await myBlocks(viewer) });
}

/** Block or unblock someone. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const b = await body(req, z.object({ userId: z.string().max(64), on: z.boolean() }));
  if (!b) return fail("Who?");
  return result(b.on ? await block(viewer, b.userId) : await unblock(viewer, b.userId));
}
