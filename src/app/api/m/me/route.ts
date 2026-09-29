import { z } from "zod";
import { appViewer, body, fail, ok } from "@/lib/app/http";
import { db } from "@/lib/db";

/** Who's signed in, and whether they're in yet. */
export async function GET() {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const app = await db.application.findUnique({ where: { userId: viewer.user.id }, select: { status: true, building: true, lastWeek: true, createdAt: true } });
  return ok({
    id: viewer.user.id,
    name: viewer.user.name,
    email: viewer.user.email,
    access: viewer.profile.access,
    onboarded: !!viewer.profile.onboardedAt,
    headline: viewer.profile.headline,
    application: app ? { status: app.status, building: app.building, lastWeek: app.lastWeek, createdAt: app.createdAt.toISOString() } : null,
  });
}

const basics = z.object({
  name: z.string().trim().min(1).max(80),
  headline: z.string().trim().max(140),
  beliefs: z.string().trim().max(1000),
  buildingToward: z.string().trim().max(1000),
  gaps: z.string().trim().max(1000),
});

/** The app's short onboarding: name, one line, and three answers your Self starts from. */
export async function POST(req: Request) {
  const { viewer, res } = await appViewer();
  if (res) return res;
  const b = await body(req, basics);
  if (!b) return fail("Check your answers.");
  await db.user.update({ where: { id: viewer.user.id }, data: { name: b.name } });
  await db.profile.update({
    where: { userId: viewer.user.id },
    data: { headline: b.headline || null, beliefs: b.beliefs || null, buildingToward: b.buildingToward || null, gaps: b.gaps || null, onboardedAt: viewer.profile.onboardedAt ?? new Date() },
  });
  return ok({ ok: true });
}
