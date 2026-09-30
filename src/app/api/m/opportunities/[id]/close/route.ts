import { appViewer, result } from "@/lib/app/http";
import { closeOpportunity } from "@/lib/app/opportunities";

/** Host: stop taking requests. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return result(await closeOpportunity(viewer, (await ctx.params).id));
}
