import { appViewer, ok } from "@/lib/app/http";
import { listPartners } from "@/lib/app/people";

export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ partners: await listPartners(viewer) });
}
