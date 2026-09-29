import { z } from "zod";
import { applyForAccess } from "@/lib/app/access";
import { appViewer, body, fail, result } from "@/lib/app/http";

export async function POST(req: Request) {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const b = await body(req, z.object({ building: z.string().max(2000), lastWeek: z.string().max(2000) }));
  if (!b) return fail("Answer both questions.");
  return result(await applyForAccess(viewer.user.id, b));
}
