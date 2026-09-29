/*
 * The SELF app, stage 1 (founding circles). Everyone in the demo is a member
 * except "new" (hasn't asked yet) and "leo" (applied, waiting for a yes).
 * Maya's circle has four check-ins this week (not hers, so the demo can check
 * in), a few replies, and mentors have office hours over the next week.
 * The invite code SELF-DEMO-2026 is always free for the demo.
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import { weekOf } from "../src/lib/app-rules";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const DEMO_INVITE = "SELF-DEMO-2026";

export async function seedCircles(db: PrismaClient, idOf: (key: string) => string) {
  const demo = { email: { endsWith: "@self.demo" } };
  await db.circle.deleteMany({ where: { members: { some: { user: demo } } } });
  await db.circle.deleteMany({ where: { members: { none: {} } } });
  await db.inviteCode.deleteMany({ where: { OR: [{ createdBy: demo }, { code: DEMO_INVITE }] } });
  await db.application.deleteMany({ where: { user: demo } });
  await db.officeHour.deleteMany({ where: { mentor: demo } });

  // Access: members, one applicant, one newcomer.
  await db.profile.updateMany({ where: { user: demo }, data: { access: "MEMBER" } });
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

  const now = new Date();
  const week = weekOf(now);
  const circle = await db.circle.create({ data: { name: "Circle 1", createdAt: new Date(Date.now() - 40 * DAY) } });
  const second = await db.circle.create({ data: { name: "Circle 2", createdAt: new Date(Date.now() - 10 * DAY) } });
  for (const k of ["maya", "dev", "joana", "rui", "lena", "tomas"]) await db.circleMember.create({ data: { circleId: circle.id, userId: idOf(k) } });
  for (const k of ["ana", "kwame", "admin"]) await db.circleMember.create({ data: { circleId: second.id, userId: idOf(k) } });

  const checkIns: [key: string, did: string, stuck: string, need: string, hoursAgo: number][] = [
    [
      "dev",
      "Got the drying rig's humidity sensor logging every minute. Two full batches dried without a restart.",
      "The cloud dashboard is eating my evenings. I keep polishing it instead of shipping the order page.",
      "Someone who has sold to restaurant kitchens, to tell me what they actually look at first.",
      30,
    ],
    [
      "joana",
      "Ran three tasting sessions with the label drafts. People remember the wave mark, not the name.",
      "Can't decide between two printers for the first 2,000 labels. One is cheaper, one is closer.",
      "A second pair of eyes on the printer quotes, and anyone who has printed on compostable film.",
      26,
    ],
    [
      "rui",
      "Wrote the first version of the supplier checklist and sent it to four kelp farms in Galicia.",
      "Only one farm answered. I don't know if it's the email or the timing.",
      "A warm intro to anyone who has bought from small seaweed farms.",
      18,
    ],
    [
      "lena",
      "Finished usability tests with six farm managers. The map view wins; the table view confuses everyone.",
      "My co-founder wants to add three features before launch. I think we should cut two.",
      "Advice on how to have the 'cut scope' conversation without it turning into a fight.",
      6,
    ],
  ];
  const made: Record<string, string> = {};
  for (const [k, did, stuck, need, h] of checkIns) {
    const c = await db.checkIn.create({ data: { circleId: circle.id, userId: idOf(k), weekOf: week, did, stuck, need, createdAt: new Date(Date.now() - h * HOUR) } });
    made[k] = c.id;
  }
  const replies: [on: string, by: string, text: string, hoursAgo: number][] = [
    ["joana", "tomas", "Go with the closer printer for the first run. You'll want to stand next to the press at least once.", 20],
    ["rui", "maya", "Try calling them on a Tuesday morning. I know one of the farms in Arousa, happy to introduce you.", 12],
    ["dev", "lena", "Ship the order page ugly. Kitchens order by phone anyway at first.", 4],
  ];
  for (const [on, by, text, h] of replies) await db.circleReply.create({ data: { checkInId: made[on], authorId: idOf(by), text, createdAt: new Date(Date.now() - h * HOUR) } });

  // Circle 2 has a quieter week: one check-in.
  await db.checkIn.create({
    data: {
      circleId: second.id,
      userId: idOf("ana"),
      weekOf: week,
      did: "Signed the second hospital for night deliveries.",
      stuck: "Our oven can't keep up with two hospitals.",
      need: "Someone who has scaled a small bakery without losing the taste.",
      createdAt: new Date(Date.now() - 8 * HOUR),
    },
  });

  // Office hours: a few 20-minute slots per open mentor over the next week.
  const at = (daysAhead: number, hourUtc: number) => {
    const d = new Date(now.getTime() + daysAhead * DAY);
    d.setUTCHours(hourUtc, 0, 0, 0);
    return d;
  };
  const slots: [mentor: string, days: number, hour: number, minutes?: number][] = [
    ["ines", 1, 9], ["ines", 1, 9.5], ["ines", 3, 16], ["ines", 6, 10],
    ["rosa", 2, 8], ["rosa", 2, 8.5], ["rosa", 4, 14],
    ["tunde", 1, 17], ["tunde", 5, 11], ["tunde", 5, 11.5],
    ["dev", 3, 19, 30],
    ["marcus", 4, 15, 30],
  ];
  for (const [m, d, h, minutes] of slots) {
    const start = at(d, Math.floor(h));
    if (h % 1) start.setUTCMinutes(30);
    await db.officeHour.create({ data: { mentorId: idOf(m), startsAt: start, minutes: minutes ?? 20 } });
  }
  // Two already booked: Maya with Rosa, Joana with Ines.
  const book = async (mentor: string, days: number, hour: number, by: string, topic: string) =>
    db.officeHour.create({
      data: { mentorId: idOf(mentor), startsAt: at(days, hour), minutes: 20, bookedById: idOf(by), topic, bookedAt: new Date(Date.now() - 5 * HOUR) },
    });
  await book("rosa", 2, 10, "maya", "Which EU grant fits a kelp company before we have revenue, and how early to start the application.");
  await book("ines", 4, 13, "joana", "How many labels to order for a first run without getting stuck with boxes of them.");

  // Invites: three each for circle members, one used; plus the demo code.
  const codes: [by: string, code: string, usedBy?: string][] = [
    ["maya", "SELF-WAVE-7K2M"], ["maya", "SELF-SEAS-3HQP"], ["maya", "SELF-RAFT-9XNB", "rui"],
    ["dev", "SELF-GRID-4TWA"], ["dev", "SELF-VAST-8PRE"],
    ["admin", DEMO_INVITE],
  ];
  for (const [by, code, usedBy] of codes)
    await db.inviteCode.create({ data: { code, createdById: idOf(by), usedById: usedBy ? idOf(usedBy) : null, usedAt: usedBy ? new Date(Date.now() - 30 * DAY) : null } });

  console.log("Seeded circles, check-ins, office hours and invites.");
}
