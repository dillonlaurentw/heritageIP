import { appViewer, fail, ok } from "@/lib/app/http";
import { mentorDetail } from "@/lib/app/mentors";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const m = await mentorDetail((await ctx.params).id, viewer.user.id);
  return m ? ok(m) : fail("Not found.", 404);
}
