/*
 * Phase 7 demo data: posted roles across companies, companies open to
 * backers, and signals in every state so Connections, the roles board and
 * game-plan steps look real. No server-only imports: the seed runs in Node.
 */
import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { B } from "../src/lib/blocks";
import { seedSystemDb } from "./seed-content";

type IdOf = (key: string) => string;
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

async function ws(db: PrismaClient, slug: string) {
  return db.workspace.findUniqueOrThrow({ where: { slug }, select: { id: true, slug: true, name: true, createdById: true } });
}

async function rowIn(db: PrismaClient, workspaceId: string, systemKey: string, title: string) {
  const row = await db.page.findFirst({ where: { workspaceId, kind: "ROW", title, parent: { systemKey } }, select: { id: true, props: true } });
  if (!row) throw new Error(`Seed: no "${title}" in ${systemKey}`);
  return row;
}

export async function seedNetwork(db: PrismaClient, idOf: IdOf) {
  const [tide, bakery, ground, clinic] = await Promise.all([ws(db, "tidewater-kelp"), ws(db, "night-shift-bakery"), ws(db, "ground-truth"), ws(db, "parallel-clinic")]);

  // ── Companies open to backers (interest only). ──
  await db.workspace.update({
    where: { id: tide.id },
    data: {
      discoverable: true,
      discoverableAt: ago(5),
      sector: "Climate",
      backerAsk: "Someone who has sold into European supermarkets, or backed a packaging or materials company before.",
      featured: true,
      featuredAt: ago(3),
    },
  });
  await db.workspace.update({
    where: { id: bakery.id },
    data: { discoverable: true, discoverableAt: ago(12), sector: "Food", backerAsk: "Operators who have run food businesses with night shifts or hospital contracts." },
  });

  // ── Posted roles in other companies, so the board has range. ──
  await seedSystemDb(
    db,
    bakery,
    "roles",
    [
      {
        title: "Head baker, nights (co-founder)",
        props: { commitment: "cofounder", state: "open", skills: "Bread and pastry at volume, food safety, leading a small night crew", posted: true },
        content: [B.p("Own the night kitchen: recipes that survive a 3am bake, a crew of three, and the hospital delivery window.")],
        createdById: idOf("ana"),
        daysAgo: 8,
      },
    ],
    { createdById: idOf("ana") },
  );
  await seedSystemDb(
    db,
    ground,
    "roles",
    [
      {
        title: "Field researcher (part-time)",
        props: { commitment: "parttime", state: "open", skills: "Interviewing farmers, Spanish, soil or agronomy background", posted: true },
        content: [B.p("Two days a week visiting farms in Andalusia with our sensor kit, and writing up what farmers actually do.")],
        createdById: idOf("kwame"),
        daysAgo: 4,
      },
    ],
    { createdById: idOf("kwame") },
  );
  await seedSystemDb(
    db,
    clinic,
    "roles",
    [
      {
        title: "Growth lead (freelance)",
        props: { commitment: "freelance", state: "open", skills: "Health marketing, referral programmes, clinics", posted: true },
        createdById: idOf("lena"),
        daysAgo: 2,
      },
    ],
    { createdById: idOf("lena") },
  );

  // ── Signals in every state. ──
  const maya = idOf("maya");
  const designer = await rowIn(db, tide.id, "roles", "Packaging designer (freelance)");
  const legalStep = await rowIn(db, tide.id, "gamePlan", "Form the company in Portugal");
  const pressStep = await rowIn(db, tide.id, "gamePlan", "Contract a local kelp press");
  const foodStep = await rowIn(db, tide.id, "gamePlan", "Food-contact certification");
  const [harbor, iberia] = await Promise.all([
    db.partner.findUniqueOrThrow({ where: { slug: "harbor-and-vine-legal" } }),
    db.partner.findUniqueOrThrow({ where: { slug: "iberia-fibre-works" } }),
  ]);
  const admin = idOf("admin");

  type S = Prisma.SignalUncheckedCreateInput & { notify?: string };
  const signals: S[] = [
    {
      kind: "ROLE_INTEREST",
      fromUserId: idOf("lena"),
      toUserId: maya,
      workspaceId: tide.id,
      pageId: designer.id,
      note: "I designed the moulded-fibre range at my last studio and I'd love to work on something food-contact. I can do two days a week from October.",
      createdAt: ago(1),
      notify: "Lena Fischer is interested in “Packaging designer (freelance)”",
    },
    {
      kind: "PARTNER_INTRO",
      status: "ACCEPTED",
      respondedAt: ago(2),
      fromUserId: maya,
      toUserId: idOf("harbor"),
      workspaceId: tide.id,
      partnerId: harbor.id,
      pageId: legalStep.id,
      note: "We're forming an Lda in Portugal with two founders and need vesting and an IP assignment for the tray design.",
      createdAt: ago(4),
    },
    {
      kind: "PARTNER_INTRO",
      fromUserId: maya,
      toUserId: admin,
      workspaceId: tide.id,
      partnerId: iberia.id,
      pageId: pressStep.id,
      note: "Looking for a 5,000-tray sample run on a food-contact line, ideally in November.",
      createdAt: ago(1),
      notify: "Maya Okonkwo (Tidewater Kelp) asked for an intro to Iberia Fibre Works",
    },
    {
      kind: "MENTOR_REQUEST",
      fromUserId: maya,
      toUserId: idOf("tunde"),
      workspaceId: tide.id,
      pageId: foodStep.id,
      note: "We need EU food-contact certification for kelp trays and don't know where to start. Could I ask you three questions?",
      createdAt: ago(2),
      notify: "Maya Okonkwo (Tidewater Kelp) asked you to mentor them",
    },
    {
      kind: "BACKER_INTEREST",
      fromUserId: idOf("priya"),
      toUserId: maya,
      workspaceId: tide.id,
      note: "I back materials companies selling into food retail, and I've worked with two Iberian supermarket groups. Happy to share what they ask for.",
      createdAt: ago(0.5),
      notify: "A backer, Priya, is interested in Tidewater Kelp",
    },
    {
      kind: "BACKER_INTEREST",
      status: "ACCEPTED",
      respondedAt: ago(6),
      fromUserId: idOf("marcus"),
      toUserId: idOf("ana"),
      workspaceId: bakery.id,
      note: "I ran a hospital catering business for ten years. I'd like to hear how you're thinking about the night-shift contracts.",
      createdAt: ago(9),
    },
    {
      kind: "MENTOR_REQUEST",
      status: "ACCEPTED",
      respondedAt: ago(10),
      fromUserId: idOf("kwame"),
      toUserId: idOf("dev"),
      workspaceId: ground.id,
      note: "Could you look at our sensor data pipeline? We're drowning in readings nobody uses.",
      createdAt: ago(12),
    },
  ];
  for (const { notify, ...data } of signals) {
    const s = await db.signal.create({ data });
    if (notify) {
      await db.notification.create({
        data: { userId: data.toUserId, actorId: data.fromUserId, kind: "SIGNAL", text: notify, href: "/network/connections", signalId: s.id, workspaceId: data.workspaceId ?? null, createdAt: data.createdAt as Date },
      });
    }
    if (data.kind === "ROLE_INTEREST") {
      // Lena is already in the Candidates pipeline; tie her row to this signal.
      const lena = await rowIn(db, tide.id, "candidates", "Lena Fischer");
      await db.page.update({ where: { id: lena.id }, data: { props: { ...((lena.props ?? {}) as object), signalId: s.id, stage: "new" } as Prisma.InputJsonValue } });
    }
  }
  console.log(`Seeded ${signals.length} signals.`);
}
