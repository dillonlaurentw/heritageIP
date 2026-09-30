import { z } from "zod";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { forgetPushToken, registerPushToken } from "@/lib/app/push";

/** This phone wants push notifications. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const b = await body(req, z.object({ token: z.string().max(200), platform: z.string().max(20).nullable().optional() }));
  if (!b) return fail("No token.");
  return result(await registerPushToken(viewer.user.id, b.token, b.platform ?? null));
}

/** Signing out on this phone: stop pushing to it. */
export async function DELETE(req: Request) {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const b = await body(req, z.object({ token: z.string().max(200) }));
  if (!b) return fail("No token.");
  return result(await forgetPushToken(viewer.user.id, b.token));
}
