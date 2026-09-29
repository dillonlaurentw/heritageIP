/*
 * Demo data. Every person here is fictional; emails end in @self.demo so the
 * sign-in page can offer "sign in as" in dev. Safe to re-run: it resets
 * everything demo people own and rebuilds it.
 *
 *   npx prisma db seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { hubs, partners, people, plans } from "./seed-data";
import { seedPrivatePages, seedTidewaterPages, seedWorkspaceContent } from "./seed-content";
import { seedNetwork } from "./seed-network";
import { seedComments } from "./seed-comments";
import { seedSimulations } from "./seed-sims";
import { seedUsage } from "./seed-usage";
import { seedSelf } from "./seed-self";
import { seedMessages } from "./seed-messages";
import { seedAreas } from "./seed-areas";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DAY = 86_400_000;

/** Who else works in each demo workspace (the owner is added automatically). */
const TEAMS: Record<string, { key: string; role: "ADMIN" | "MEMBER" | "GUEST"; title: string; daysAgo: number }[]> = {
  "tidewater-kelp": [
    { key: "dev", role: "ADMIN", title: "Co-founder, technology", daysAgo: 30 },
    { key: "rosa", role: "GUEST", title: "Mentor, grants", daysAgo: 12 },
  ],
  "night-shift-bakery": [{ key: "kwame", role: "MEMBER", title: "Advisor, hospital partnerships", daysAgo: 20 }],
  "ground-truth": [{ key: "lena", role: "MEMBER", title: "Product designer", daysAgo: 25 }],
  "parallel-clinic": [{ key: "tomas", role: "MEMBER", title: "Clinical lead", daysAgo: 18 }],
};

async function seedPeople() {
  for (const p of people) {
    const { key, name, onboarded = true, ...rest } = p;
    const email = `${key}@self.demo`;
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, emailVerified: true },
      update: { name },
    });
    // Explicit nulls so re-seeding resets anything changed while testing.
    const blank = {
      beliefs: null, workStyle: null, buildingToward: null, strengths: null, gaps: null,
      decisionStyle: null, mentorNote: null, backerNote: null, partnerOrgName: null, contactLink: null, mentorOpen: true,
      persona: null, personaUpdatedAt: null, simOptIn: false, simOptInAt: null, selfDoc: Prisma.DbNull,
      openToMatches: false, openToMatchesAt: null, openToMatchesNote: null,
    };
    const data = {
      ...blank,
      ...rest,
      headline: rest.headline || null,
      location: rest.location || null,
      focusAreas: rest.focusAreas ?? [],
      contactEmail: email,
      onboardedAt: onboarded ? new Date() : null,
      onboardingStep: 0,
      openToMatchesAt: rest.openToMatches ? new Date() : null,
    };
    await db.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  }
  const users = await db.user.findMany({ where: { email: { endsWith: "@self.demo" } }, select: { id: true, email: true, name: true } });
  console.log(`Seeded ${people.length} people.`);
  return new Map(users.map((u) => [u.email.split("@")[0], u]));
}

async function main() {
  const byKey = await seedPeople();
  const idOf = (key: string) => {
    const u = byKey.get(key);
    if (!u) throw new Error(`No demo person "${key}"`);
    return u.id;
  };
  const demoIds = [...byKey.values()].map((u) => u.id);

  // ── Reset: everything demo people created goes; the rest is rebuilt. ──
  await db.workspace.deleteMany({ where: { createdById: { in: demoIds } } });
  await db.signal.deleteMany({ where: { OR: [{ fromUserId: { in: demoIds } }, { toUserId: { in: demoIds } }] } });
  await db.agentRun.deleteMany({ where: { userId: { in: demoIds } } });
  await db.agentThread.deleteMany({ where: { userId: { in: demoIds } } });
  await db.simulation.deleteMany({ where: { createdById: { in: demoIds } } });
  await db.notification.deleteMany({ where: { userId: { in: demoIds } } });
  await db.invite.deleteMany({ where: { email: { endsWith: "@self.demo" } } });

  // ── Private spaces, so the sidebar has something personal. ──
  for (const u of byKey.values()) {
    const personal = await db.workspace.create({
      data: {
        kind: "PERSONAL",
        slug: `private-${u.email.split("@")[0]}`,
        name: "Private",
        createdById: u.id,
        members: { create: { userId: u.id, role: "OWNER" } },
      },
    });
    if (u.email.startsWith("maya@")) await seedPrivatePages(db, personal, u.id);
  }

  // ── Team workspaces: one per demo company. ──
  for (const [i, h] of hubs.entries()) {
    const ownerId = idOf(h.owner);
    const created = new Date(Date.now() - (hubs.length - i) * 9 * DAY);
    const ws = await db.workspace.create({
      data: {
        kind: "TEAM",
        slug: h.slug,
        name: h.name,
        oneLiner: h.oneLiner,
        rawIdea: h.rawIdea,
        stage: h.thesis ? "THESIS" : "IDEA",
        createdById: ownerId,
        createdAt: created,
        members: {
          create: [
            { userId: ownerId, role: "OWNER", title: "Founder", joinedAt: created },
            ...(TEAMS[h.slug] ?? []).map((m) => ({
              userId: idOf(m.key),
              role: m.role,
              title: m.title,
              joinedAt: new Date(Date.now() - m.daysAgo * DAY),
            })),
          ],
        },
      },
    });
    await db.activity.create({ data: { workspaceId: ws.id, actorId: ownerId, kind: "workspace.created", createdAt: created, data: { name: h.name } } });
    for (const m of TEAMS[h.slug] ?? []) {
      await db.activity.create({
        data: { workspaceId: ws.id, actorId: idOf(m.key), kind: "member.joined", createdAt: new Date(Date.now() - m.daysAgo * DAY) },
      });
    }
    await seedWorkspaceContent(db, ws, h, plans[h.slug]);
    if (h.thesis) await db.workspace.update({ where: { id: ws.id }, data: { stage: plans[h.slug] ? "PLAN" : "THESIS" } });
  }

  // A pending invite, so People shows one.
  const tide = await db.workspace.findUniqueOrThrow({ where: { slug: "tidewater-kelp" } });
  await seedTidewaterPages(db, tide, idOf);
  await db.invite.create({
    data: {
      workspaceId: tide.id,
      email: "ines@self.demo",
      role: "GUEST",
      token: "demo-invite-ines",
      invitedById: idOf("maya"),
      expiresAt: new Date(Date.now() + 10 * DAY),
    },
  });
  console.log(`Seeded ${hubs.length} workspaces.`);

  // ── Partner directory. ──
  for (const p of partners) {
    const { claimedBy, ...data } = p;
    const row = { ...data, contactEmail: `intros@${p.slug}.example`, website: `https://${p.slug}.example`, claimedById: claimedBy ? idOf(claimedBy) : null };
    await db.partner.upsert({ where: { slug: p.slug }, create: row, update: row });
  }
  console.log(`Seeded ${partners.length} partners.`);

  await seedNetwork(db, idOf);
  await seedSimulations(db, idOf);
  await seedComments(db, idOf);
  await seedUsage(db, idOf);
  await seedSelf(db, idOf);
  await seedMessages(db, idOf);
  await seedAreas(db, idOf);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
