import { appViewer, ok } from "@/lib/app/http";
import { listMentors } from "@/lib/app/mentors";

export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ mentors: await listMentors(viewer.user.id) });
}
