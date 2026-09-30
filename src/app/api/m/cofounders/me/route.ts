import { z } from "zod";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { setOpenToMatches } from "@/lib/app/people";

/** Your switch: open to building with someone, and what you're looking for. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ open: z.boolean(), note: z.string().max(400).nullable() }));
  if (!b) return fail("On or off?");
  return result(await setOpenToMatches(viewer, b.open, b.note));
}
