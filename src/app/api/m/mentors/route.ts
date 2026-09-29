import { listMentors } from "@/lib/app/hours";
import { appViewer, ok } from "@/lib/app/http";

export async function GET() {
  const { res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ mentors: await listMentors() });
}
