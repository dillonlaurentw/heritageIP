import { appViewer, ok } from "@/lib/app/http";
import { hosting } from "@/lib/app/opportunities";

/** What you're hosting, with who asked to come. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ hosting: await hosting(viewer) });
}
