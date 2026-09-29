import { appViewer, result } from "@/lib/app/http";
import { deleteJournal } from "@/lib/app/journal";

/** Delete one of your entries for good. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return result(await deleteJournal(viewer.user.id, (await ctx.params).id));
}
