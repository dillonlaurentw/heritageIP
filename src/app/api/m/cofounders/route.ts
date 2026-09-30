import { appViewer, ok } from "@/lib/app/http";
import { coFounders } from "@/lib/app/people";

/** People open to building with someone, and your own switch. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ people: await coFounders(viewer), me: { open: viewer.profile.openToMatches, note: viewer.profile.openToMatchesNote } });
}
