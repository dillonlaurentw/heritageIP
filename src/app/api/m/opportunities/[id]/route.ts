import { appViewer, fail, ok } from "@/lib/app/http";
import { opportunityDetail } from "@/lib/app/opportunities";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const o = await opportunityDetail(viewer, (await ctx.params).id);
  return o ? ok(o) : fail("Not found.", 404);
}
