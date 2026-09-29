import { summariseWeek } from "@/lib/app/circles";
import { appViewer, result } from "@/lib/app/http";

export async function POST() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return result(await summariseWeek(viewer.user.id));
}
