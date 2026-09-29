import { myInvites } from "@/lib/app/access";
import { appViewer, ok } from "@/lib/app/http";

export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ invites: await myInvites(viewer.user.id) });
}
