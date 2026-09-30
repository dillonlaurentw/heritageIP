import { z } from "zod";
import { FIELDS, STAGES } from "@/lib/app-rules";
import { appViewer, body, fail, ok } from "@/lib/app/http";
import { createOpportunity, opportunitiesFor } from "@/lib/app/opportunities";

/** The opportunities that fit you, each with why. */
export async function GET() {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  return ok({ opportunities: await opportunitiesFor(viewer), canHost: ["MENTOR", "PARTNER", "BACKER", "ADMIN"].some((r) => viewer.profile.roles.includes(r as never)) });
}

const input = z.object({
  kind: z.enum(["DINNER", "TRIP", "WORKSHOP", "EVENT", "INTRO_DAY"]),
  title: z.string().max(120),
  description: z.string().max(2000),
  place: z.string().min(1).max(120),
  startsAt: z.string().datetime(),
  seats: z.number().int(),
  forWho: z.string().max(200),
  fields: z.array(z.enum(Object.keys(FIELDS) as [string, ...string[]])).max(8),
  stages: z.array(z.enum(Object.keys(STAGES) as [string, ...string[]])).max(4),
  buildingOnly: z.boolean(),
  costNote: z.string().max(200).nullable().optional(),
});

/** Host something (mentors, partners, backers, admins). */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer({ member: true });
  if (res) return res;
  const b = await body(req, input);
  if (!b) return fail("Check the details.");
  const r = await createOpportunity(viewer, { ...b, startsAt: new Date(b.startsAt) });
  return r.ok ? ok(r) : fail(r.message);
}
