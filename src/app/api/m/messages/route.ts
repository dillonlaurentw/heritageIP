import { appViewer, ok } from "@/lib/app/http";
import { listConversations } from "@/lib/messages";

export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const items = await listConversations(viewer.user.id);
  return ok({ conversations: items.map((c) => ({ ...c, last: c.last ? { ...c.last, at: c.last.at.toISOString() } : null })) });
}
