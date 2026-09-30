import { z } from "zod";
import { REPORT_REASONS, type ReportReason } from "@/lib/app-rules";
import { appViewer, body, fail, result } from "@/lib/app/http";
import { report } from "@/lib/app/safety";

const input = z.object({
  kind: z.enum(["PERSON", "MESSAGE", "CIRCLE_MESSAGE", "OPPORTUNITY", "UPDATE"]),
  targetId: z.string().max(64).optional(),
  userId: z.string().max(64).optional(),
  reason: z.enum(Object.keys(REPORT_REASONS) as [ReportReason, ...ReportReason[]]),
  note: z.string().max(2000).optional(),
  alsoBlock: z.boolean().optional(),
});

/** Report a person or something they wrote. An admin reviews every report. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const b = await body(req, input);
  if (!b) return fail("Pick a reason.");
  return result(await report(viewer, b));
}
