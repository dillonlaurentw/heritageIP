import { appViewer, fail, ok } from "@/lib/app/http";
import { foundersForBacker } from "@/lib/app/capital";

/** Backers: founders sharing updates with backers. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const founders = await foundersForBacker(viewer);
  return founders ? ok({ founders }) : fail("For backers only.", 403);
}
