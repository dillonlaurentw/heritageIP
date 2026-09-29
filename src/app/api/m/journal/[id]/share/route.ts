import { appViewer, result } from "@/lib/app/http";
import { shareJournal } from "@/lib/app/journal";

/** Share one of your own entries with your circle. The journal itself stays private. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return result(await shareJournal(viewer.user.id, (await ctx.params).id));
}
