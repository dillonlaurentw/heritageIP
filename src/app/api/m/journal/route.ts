import { z } from "zod";
import { appViewer, body, fail, ok } from "@/lib/app/http";
import { loadJournal, writeJournal } from "@/lib/app/journal";

/** Your journal: today and the last two weeks. Only you can read it. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok(await loadJournal(viewer.user.id));
}

/** Write or say something; SELF answers. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, z.object({ text: z.string().max(8000), spoken: z.boolean().optional() }));
  if (!b) return fail("Say or write something first.");
  const r = await writeJournal(viewer, b.text, !!b.spoken);
  return r.ok ? ok(r) : fail(r.message);
}
