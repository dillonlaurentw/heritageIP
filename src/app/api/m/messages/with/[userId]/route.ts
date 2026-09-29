import { appViewer, fail, ok } from "@/lib/app/http";
import { openConversation } from "@/lib/messages";

/** Open (or find) the conversation with someone you may message: circle-mates, people who said yes. */
export async function POST(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const r = await openConversation(viewer, (await ctx.params).userId);
  return r.ok ? ok({ id: r.id }) : fail(r.message);
}
