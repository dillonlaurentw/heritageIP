import { z } from "zod";
import { appViewer, body, fail, ok, result } from "@/lib/app/http";
import { isBacker, myCapital, setOpenToBackers } from "@/lib/app/capital";

/** Founders: your shared updates, who follows them, and interest from backers. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ ...(await myCapital(viewer)), isBacker: isBacker(viewer) });
}

/** Open (or close) your updates to backers on SELF. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ openToBackers: z.boolean() }));
  if (!b) return fail("On or off?");
  return result(await setOpenToBackers(viewer, b.openToBackers));
}
