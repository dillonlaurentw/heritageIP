import { catchUp } from "@/lib/app/circles";
import { appViewer, result } from "@/lib/app/http";

/** "Catch me up": SELF's short note on the circle's week. */
export async function POST() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return result(await catchUp(viewer.user.id));
}
