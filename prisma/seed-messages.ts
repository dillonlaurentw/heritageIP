/*
 * Messages and matches (Self3): Maya talks with Dev and Rosa (they work
 * together), Joana said yes to Maya's "let's talk" and has a trial week
 * waiting for her answer, and Rui is a fresh match nobody has contacted.
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import { pairKey, type TrialData } from "../src/lib/message-rules";

const MIN = 60_000;

export async function seedMessages(db: PrismaClient, idOf: (key: string) => string) {
  await db.conversation.deleteMany({ where: { members: { some: { user: { email: { endsWith: "@self.demo" } } } } } });
  await db.matchNote.deleteMany({ where: { user: { email: { endsWith: "@self.demo" } } } });
  const tide = await db.workspace.findUniqueOrThrow({ where: { slug: "tidewater-kelp" }, select: { id: true, name: true } });
  const brand = await db.page.findFirstOrThrow({ where: { workspaceId: tide.id, title: "Brand and story co-founder", parent: { systemKey: "roles" } }, select: { id: true } });
  const maya = idOf("maya");

  const talk = async (a: string, b: string, lines: [who: string, text: string, minsAgo: number][], opts: { workspaceId?: string; readUpTo?: number } = {}) => {
    const conv = await db.conversation.create({
      data: {
        pairKey: pairKey(a, b),
        workspaceId: opts.workspaceId ?? tide.id,
        members: { create: [{ userId: a, lastReadAt: new Date() }, { userId: b, lastReadAt: new Date(Date.now() - (opts.readUpTo ?? 0) * MIN) }] },
      },
    });
    for (const [who, text, mins] of lines) {
      await db.directMessage.create({ data: { conversationId: conv.id, authorId: who, text, createdAt: new Date(Date.now() - mins * MIN) } });
    }
    const last = lines.at(-1);
    await db.conversation.update({ where: { id: conv.id }, data: { updatedAt: new Date(Date.now() - (last?.[2] ?? 0) * MIN) } });
    return conv.id;
  };

  const dev = idOf("dev");
  await talk(
    maya,
    dev,
    [
      [dev, "Northloop sent the sample schedule. First run is the second week of November.", 300],
      [maya, "Good. Can you check their spec against the 48-hour ice test before we sign?", 290],
      [dev, "On it. I'll put the comparison in the Processor interviews page.", 280],
      [dev, "Done. Two things don't match: wall thickness and the lid seal. Want to talk tomorrow?", 45],
    ],
    { readUpTo: 60 },
  );
  // Maya hasn't read Dev's last message yet.
  await db.conversationMember.updateMany({ where: { userId: maya, conversation: { pairKey: pairKey(maya, dev) } }, data: { lastReadAt: new Date(Date.now() - 60 * MIN) } });

  const rosa = idOf("rosa");
  await talk(maya, rosa, [
    [rosa, "The Blue Economy call opens on the 3rd. I can read your draft the week before.", 2000],
    [maya, "Thank you. I'll send it by the 25th.", 1990],
  ]);

  // Joana: Maya reached out about the brand chair, Joana said yes, and a trial week is waiting for her answer.
  const joana = idOf("joana");
  await db.signal.create({
    data: {
      kind: "ROLE_INVITE",
      status: "ACCEPTED",
      respondedAt: new Date(Date.now() - 1500 * MIN),
      fromUserId: maya,
      toUserId: joana,
      workspaceId: tide.id,
      pageId: brand.id,
      note: "Hi Joana, I'm building Tidewater Kelp: trays made from kelp grown where the fish is landed. I need someone who can make that look like the future to a supermarket buyer. Could we talk?",
      createdAt: new Date(Date.now() - 1700 * MIN),
    },
  });
  const trial: TrialData = {
    workspaceId: tide.id,
    workspaceName: tide.name,
    roleId: brand.id,
    title: "Brand and a one-page site for buyers",
    focus: "Whether we work well together, and whether a buyer understands the tray in ten seconds.",
    status: "PENDING",
  };
  const convJoana = await talk(maya, joana, [
    [maya, "Hi Joana, I'm building Tidewater Kelp: trays made from kelp grown where the fish is landed. I need someone who can make that look like the future to a supermarket buyer. Could we talk?", 1500],
    [joana, "Yes. I grew up two towns from Peniche. I can't leave my studio clients until something is paid, but I could do three days a week.", 1400],
    [maya, "That works for now. Want to try a week on the buyer site before we talk about anything bigger?", 30],
  ]);
  await db.directMessage.create({
    data: { conversationId: convJoana, authorId: maya, kind: "TRIAL_PROPOSAL", text: `A trial week at ${tide.name}: ${trial.title}`, data: trial as object, createdAt: new Date(Date.now() - 29 * MIN) },
  });
  await db.conversation.update({ where: { id: convJoana }, data: { updatedAt: new Date(Date.now() - 29 * MIN) } });
  // Joana hasn't opened it yet.
  await db.conversationMember.updateMany({ where: { conversationId: convJoana, userId: joana }, data: { lastReadAt: new Date(Date.now() - 600 * MIN) } });
}
