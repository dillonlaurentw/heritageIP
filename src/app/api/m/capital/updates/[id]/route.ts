import { appViewer, result } from "@/lib/app/http";
import { deleteUpdate } from "@/lib/app/capital";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return result(await deleteUpdate(viewer, (await ctx.params).id));
}
