import { appViewer, ok } from "@/lib/app/http";
import { incomingRequests } from "@/lib/app/mentors";

/** Mentorship requests waiting for your answer. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ requests: await incomingRequests(viewer.user.id) });
}
