import { z } from "zod";
import { appViewer, body, fail, ok, result } from "@/lib/app/http";
import { changeSelf, selfOf } from "@/lib/self";
import { FACET_COPY, FACETS, SOURCE_COPY } from "@/lib/self-doc";

/** Your Self, line by line, with where each line came from. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const { doc } = selfOf(viewer.profile);
  return ok({
    facets: FACETS.map((f) => ({
      key: f,
      label: FACET_COPY[f].label,
      hint: FACET_COPY[f].hint,
      lines: doc.lines.filter((l) => l.facet === f).map((l) => ({ id: l.id, text: l.text, source: SOURCE_COPY[l.source] })),
    })),
    suggestions: doc.suggestions.filter((s) => s.status === "PENDING").map((s) => ({ id: s.id, text: s.text, why: s.why, facet: FACET_COPY[s.facet].label })),
    optIn: viewer.profile.simOptIn,
  });
}

const op = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add"), facet: z.enum(FACETS), text: z.string().max(2000) }),
  z.object({ type: z.literal("edit"), id: z.string().max(64), text: z.string().max(2000) }),
  z.object({ type: z.literal("remove"), id: z.string().max(64) }),
  z.object({ type: z.literal("accept"), id: z.string().max(64) }),
  z.object({ type: z.literal("reject"), id: z.string().max(64) }),
]);

export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, op);
  if (!b) return fail("That change didn't make sense.");
  return result(await changeSelf(viewer, b));
}
