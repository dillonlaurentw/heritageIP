/*
 * The SELF app, stage 1. Everyone in the demo is a member except "new"
 * (hasn't asked yet) and "leo" (applied, waiting for a yes).
 *
 * - Circles are matched by field and stage and work like a group chat.
 *   Maya's circle ("Food founders · first customers") has a week of talk,
 *   two messages she hasn't read yet, and SELF's Monday prompt.
 * - Maya's private journal has the last few days; today is empty so the
 *   demo can write in it.
 * - Mentors: Rosa said yes to Maya (they already talk); Joana has asked
 *   Rosa and is waiting, so signing in as Rosa shows a request to answer.
 * - The invite code SELF-DEMO-2026 is always free for the demo.
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import { circleName, dayOf, weekOf } from "../src/lib/app-rules";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const DEMO_INVITE = "SELF-DEMO-2026";

export async function seedCircles(db: PrismaClient, idOf: (key: string) => string) {
  const demo = { email: { endsWith: "@self.demo" } };
  await db.circle.deleteMany({ where: { members: { some: { user: demo } } } });
  await db.circle.deleteMany({ where: { members: { none: {} } } });
  await db.inviteCode.deleteMany({ where: { OR: [{ createdBy: demo }, { code: DEMO_INVITE }] } });
  await db.application.deleteMany({ where: { user: demo } });
  await db.journalMessage.deleteMany({ where: { user: demo } });
  await db.opportunity.deleteMany({ where: { host: demo } });
  await db.founderUpdate.deleteMany({ where: { author: demo } });
  await db.follow.deleteMany({ where: { backer: demo } });

  // Access: members, one applicant, one newcomer.
  await db.profile.updateMany({ where: { user: demo }, data: { access: "MEMBER", buildField: null, buildStage: null, openToBackers: false } });
  await db.profile.update({ where: { userId: idOf("new") }, data: { access: "NONE" } });
  await db.profile.update({ where: { userId: idOf("leo") }, data: { access: "APPLIED" } });
  await db.application.create({
    data: {
      userId: idOf("leo"),
      building: "Refill stations for cleaning products in corner shops, so people stop buying a new plastic bottle every month.",
      lastWeek: "Put a prototype station in two shops in Leipzig and counted refills by hand every evening. 41 refills in five days.",
      createdAt: new Date(Date.now() - 20 * HOUR),
    },
  });

  // Circles, matched by what people build and how far along they are.
  const now = new Date();
  const week = weekOf(now);
  const circles: { field: string; stage: string; people: string[] }[] = [
    { field: "FOOD", stage: "FIRST_CUSTOMERS", people: ["maya", "ana", "joana", "rui"] },
    { field: "CLIMATE", stage: "BUILDING", people: ["kwame", "lena", "dev"] },
    { field: "HEALTH", stage: "GROWING", people: ["tomas", "admin"] },
  ];
  const circleIds: string[] = [];
  for (const c of circles) {
    const row = await db.circle.create({ data: { name: circleName(c.field, c.stage), field: c.field, stage: c.stage, createdAt: new Date(Date.now() - 40 * DAY) } });
    circleIds.push(row.id);
    for (const k of c.people) {
      await db.profile.update({ where: { userId: idOf(k) }, data: { buildField: c.field, buildStage: c.stage } });
      await db.circleMember.create({ data: { circleId: row.id, userId: idOf(k), lastReadAt: now } });
    }
  }
  const food = circleIds[0]!;
  const say = (circleId: string, who: string | null, text: string, hoursAgo: number, extra: { weekOf?: Date; fromJournal?: boolean } = {}) =>
    db.circleMessage.create({ data: { circleId, authorId: who ? idOf(who) : null, text, createdAt: new Date(Date.now() - hoursAgo * HOUR), ...extra } });

  // Last week, briefly, so the chat has a history.
  await say(food, "rui", "Anyone bought from small seaweed farms before? I'm writing to four in Galicia.", 7 * 24 + 5);
  await say(food, "maya", "Call them on a Tuesday morning. I know one of the farms in Arousa, happy to introduce you.", 7 * 24 + 3);
  // This week.
  const sinceMonday = Math.max(1, (now.getTime() - week.getTime()) / HOUR - 8);
  await say(food, null, "New week. What moved last week, and what's stuck?", sinceMonday, { weekOf: week });
  await say(food, "joana", "Ran three tasting sessions with the label drafts. People remember the wave mark, not the name. Stuck choosing between two printers for the first 2,000 labels.", 30);
  await say(food, "ana", "Second hospital signed for night deliveries. Our oven can't keep up with two hospitals, so that's my week.", 26);
  await say(food, "maya", "Joana, go with the closer printer for the first run. You'll want to stand next to the press at least once.", 24);
  await say(food, "rui", "One farm answered! Tuesday morning worked, thank you Maya.", 18);
  // Two Maya hasn't read yet.
  await say(food, "ana", "Does anyone know someone who has scaled a small bakery without losing the taste?", 3);
  await say(food, "joana", "Ana, my uncle ran a bakery in Porto for 30 years. I'll ask if he'd talk to you.", 1);
  await db.circleMember.update({ where: { userId: idOf("maya") }, data: { lastReadAt: new Date(Date.now() - 4 * HOUR) } });

  const climate = circleIds[1]!;
  await say(climate, null, "New week. What moved last week, and what's stuck?", sinceMonday, { weekOf: week });
  await say(climate, "lena", "Usability tests with six farm managers: the map view wins, the table view confuses everyone.", 20);
  await say(climate, "kwame", "That matches what we hear. Cutting the table view for launch.", 12);
  // One report waiting in the admin queue: a sales pitch posted into a circle.
  const pitch = await say(climate, "dev", "Anyone want my paid course on fundraising? 50% off this week, DM me.", 9);
  await db.report.deleteMany({ where: { reporter: demo } });
  await db.report.create({
    data: { reporterId: idOf("lena"), targetUserId: idOf("dev"), kind: "CIRCLE_MESSAGE", targetId: pitch.id, excerpt: pitch.text, reason: "SPAM", note: "Selling in the circle.", createdAt: new Date(Date.now() - 8 * HOUR) },
  });

  // Maya's private journal: the last three days. Today is left for the demo.
  const today = dayOf(now);
  const entry = async (daysAgo: number, lines: [role: "ME" | "SELF", text: string][]) => {
    const day = new Date(today.getTime() - daysAgo * DAY);
    let t = day.getTime() + 19 * HOUR;
    for (const [role, text] of lines) {
      await db.journalMessage.create({ data: { userId: idOf("maya"), role, text, day, createdAt: new Date((t += 4 * 60_000)), demo: role === "SELF" } });
    }
  };
  await entry(3, [
    ["ME", "Northloop sent the sample schedule. First run is the second week of November. Relieved, but I haven't told the team the tray spec might change."],
    ["SELF", "Sounds like the schedule is the easy part and the spec conversation is the hard one. What's stopping you from raising it tomorrow?"],
    ["ME", "Fear that Dev will want to redo the drying rig. But he'd rather know now. Telling him in the morning."],
  ]);
  await entry(2, [
    ["ME", "Told Dev. He was fine. We found two mismatches with Northloop's spec: wall thickness and the lid seal."],
    ["SELF", "Good that it came out early. Which of the two could stop the November run if it isn't fixed?"],
  ]);
  await entry(1, [
    ["ME", "Pricing again. A restaurant group asked for a price per tray and I said 'it depends'. Third time this month."],
    ["SELF", "That's the third time pricing has come up in a week. What would you need to know to say one number, even a rough one?"],
    ["ME", "Our real cost per tray at 5,000 units. Asking Dev for it."],
  ]);

  // Mentors: Rosa said yes to Maya; Joana is waiting on Rosa.
  const tide = await db.workspace.findUniqueOrThrow({ where: { slug: "tidewater-kelp" }, select: { id: true } });
  await db.signal.deleteMany({ where: { kind: "MENTOR_REQUEST", toUserId: idOf("rosa") } });
  await db.signal.create({
    data: {
      kind: "MENTOR_REQUEST",
      status: "ACCEPTED",
      fromUserId: idOf("maya"),
      toUserId: idOf("rosa"),
      workspaceId: tide.id,
      note: "We're a kelp packaging company before revenue. I'd love help working out which EU grants fit and when to start.",
      createdAt: new Date(Date.now() - 20 * DAY),
      respondedAt: new Date(Date.now() - 19 * DAY),
    },
  });
  const ask = await db.signal.create({
    data: {
      kind: "MENTOR_REQUEST",
      fromUserId: idOf("joana"),
      toUserId: idOf("rosa"),
      note: "I'm building the brand for a kelp packaging company and thinking about starting my own food label. Could you help me understand grants for small food brands?",
      createdAt: new Date(Date.now() - 6 * HOUR),
    },
  });
  await db.notification.create({
    data: { userId: idOf("rosa"), actorId: idOf("joana"), kind: "SIGNAL", text: "Joana Pires asked you to mentor them", href: "/network/connections", signalId: ask.id, createdAt: ask.createdAt },
  });

  await seedOpportunities(db, idOf);
  await seedCapital(db, idOf);

  // Invites: three each for a couple of members, one used; plus the demo code.
  const codes: [by: string, code: string, usedBy?: string][] = [
    ["maya", "SELF-WAVE-7K2M"], ["maya", "SELF-SEAS-3HQP"], ["maya", "SELF-RAFT-9XNB", "rui"],
    ["dev", "SELF-GRID-4TWA"], ["dev", "SELF-VAST-8PRE"],
    ["admin", DEMO_INVITE],
  ];
  for (const [by, code, usedBy] of codes)
    await db.inviteCode.create({ data: { code, createdById: idOf(by), usedById: usedBy ? idOf(usedBy) : null, usedAt: usedBy ? new Date(Date.now() - 30 * DAY) : null } });

  console.log("Seeded circles, journals, mentor requests and invites.");
}

/*
 * Opportunities. Maya (food, first customers, building lately) sees four of
 * the five: the health workshop isn't for her. She's already in Marcus's
 * workshop; Rosa's dinner has two requests waiting for Rosa to pick.
 */
async function seedOpportunities(db: PrismaClient, idOf: (key: string) => string) {
  const at = (days: number, hourUtc: number) => {
    const d = new Date(Date.now() + days * DAY);
    d.setUTCHours(hourUtc, 0, 0, 0);
    return d;
  };
  const make = (data: Parameters<typeof db.opportunity.create>[0]["data"]) => db.opportunity.create({ data });
  const dinner = await make({
    hostId: idOf("rosa"),
    kind: "DINNER",
    title: "Food founders dinner",
    description: "Eight food founders finding their first customers, one long table in Alfama, no pitching. Bring the question you can't answer yet.",
    place: "Lisbon",
    startsAt: at(9, 19),
    seats: 8,
    forWho: "Food founders finding first customers",
    fields: ["FOOD"],
    stages: ["FIRST_CUSTOMERS"],
    costNote: "Rosa hosts. Dinner is on her.",
  });
  await make({
    hostId: idOf("northloop"),
    kind: "TRIP",
    title: "Factory day in Porto",
    description: "Watch a packaging line run from raw material to pallet, meet the plant manager, and ask what small first orders really cost to set up.",
    place: "Porto",
    startsAt: at(16, 8),
    seats: 6,
    forWho: "Founders making something physical who've been building lately",
    fields: ["FOOD", "CONSUMER", "HARDWARE"],
    buildingOnly: true,
    costNote: "Northloop covers the visit. You book your own travel.",
  });
  const workshop = await make({
    hostId: idOf("marcus"),
    kind: "WORKSHOP",
    title: "How a backer reads a first meeting",
    description: "An hour on what backers actually listen for, why most first meetings end in a polite pass, and what a pass really means. Practice, not pitching.",
    place: "Online",
    startsAt: at(5, 17),
    seats: 20,
    forWho: "Any member",
    costNote: "Free.",
  });
  await make({
    hostId: idOf("admin"),
    kind: "TRIP",
    title: "Founder retreat, Sintra",
    description: "Three days in a house in the hills with eleven other founders. Mornings for your own work, afternoons walking, evenings talking about what's hard.",
    place: "Sintra",
    startsAt: at(30, 10),
    seats: 12,
    forWho: "Founders with customers who've been building lately",
    stages: ["FIRST_CUSTOMERS", "GROWING"],
    buildingOnly: true,
    costNote: "SELF covers the house. You cover your travel.",
  });
  await make({
    hostId: idOf("hana"),
    kind: "WORKSHOP",
    title: "Certification without stalling the product",
    description: "How to get clinical software certified in Germany while still shipping every week.",
    place: "Berlin",
    startsAt: at(12, 15),
    seats: 10,
    forWho: "Health founders",
    fields: ["HEALTH"],
  });
  await db.opportunityRequest.create({
    data: { opportunityId: workshop.id, userId: idOf("maya"), why: "We're about to meet our first backers and I want to hear what a pass means before I get one.", status: "PICKED", answeredAt: new Date(Date.now() - 20 * HOUR), createdAt: new Date(Date.now() - 2 * DAY) },
  });
  await db.opportunityRequest.create({ data: { opportunityId: dinner.id, userId: idOf("ana"), why: "Two hospitals signed and our oven can't keep up. I'd love to sit next to someone who has scaled a kitchen.", createdAt: new Date(Date.now() - 5 * HOUR) } });
  await db.opportunityRequest.create({ data: { opportunityId: dinner.id, userId: idOf("joana"), why: "I'm starting a small food label and want to hear how others found their first shops.", createdAt: new Date(Date.now() - 2 * HOUR) } });
}

/*
 * Capital, interest only. Maya and Ana share updates with backers; Priya
 * follows Maya (her interest waits for Maya's answer, from seed-network).
 */
async function seedCapital(db: PrismaClient, idOf: (key: string) => string) {
  const update = (who: string, text: string, daysAgo: number) =>
    db.founderUpdate.create({ data: { authorId: idOf(who), text, createdAt: new Date(Date.now() - daysAgo * DAY) } });
  await update("maya", "First sample run with Northloop is booked for the second week of November. Two spec gaps found early (wall thickness, lid seal) and being fixed now.", 6);
  await update("maya", "Quoted our first restaurant group a single price per tray. They asked for samples for three of their kitchens.", 1);
  await update("ana", "Second hospital signed for night deliveries. Now working out how to double the oven without losing the taste.", 3);
  await db.profile.update({ where: { userId: idOf("maya") }, data: { openToBackers: true } });
  await db.profile.update({ where: { userId: idOf("ana") }, data: { openToBackers: true } });
  await db.follow.create({ data: { backerId: idOf("priya"), founderId: idOf("maya") } });
  await db.follow.create({ data: { backerId: idOf("marcus"), founderId: idOf("ana") } });
}
