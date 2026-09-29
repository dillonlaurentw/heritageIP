import { appViewer, ok } from "@/lib/app/http";
import { today } from "@/lib/app/today";

export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok(await today(viewer));
}
