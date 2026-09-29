import { loadCircle } from "@/lib/app/circles";
import { appViewer, ok } from "@/lib/app/http";

export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ me: viewer.user.id, circle: await loadCircle(viewer.user.id) });
}
