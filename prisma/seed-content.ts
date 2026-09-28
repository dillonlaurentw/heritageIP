/*
 * Pages and databases inside each demo workspace. Grows phase by phase.
 * No server-only imports here: the seed runs in plain Node.
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import type { Prisma } from "../src/generated/prisma/client";
import { B, blocksToText } from "../src/lib/blocks";
import type { SeedHub } from "./seed-data";

type Ws = { id: string; slug: string; name: string; createdById: string };
type IdOf = (key: string) => string;

let position = 0;
export async function page(
  db: PrismaClient,
  ws: Ws,
  data: {
    title: string;
    icon?: string | null;
    content?: unknown[];
    parentId?: string | null;
    createdById?: string;
    systemKey?: string;
    template?: string;
    kind?: "PAGE" | "DATABASE" | "ROW";
    schema?: unknown;
    props?: Record<string, unknown>;
    daysAgo?: number;
  },
) {
  position += 1024;
  const at = data.daysAgo !== undefined ? new Date(Date.now() - data.daysAgo * 86_400_000) : undefined;
  return db.page.create({
    data: {
      workspaceId: ws.id,
      parentId: data.parentId ?? null,
      kind: data.kind ?? "PAGE",
      title: data.title,
      icon: data.icon ?? null,
      content: (data.content ?? []) as Prisma.InputJsonValue,
      text: blocksToText(data.content ?? []),
      schema: (data.schema ?? undefined) as Prisma.InputJsonValue | undefined,
      props: (data.props ?? undefined) as Prisma.InputJsonValue | undefined,
      systemKey: data.systemKey ?? null,
      template: data.template ?? null,
      position,
      createdById: data.createdById ?? ws.createdById,
      updatedById: data.createdById ?? ws.createdById,
      ...(at ? { createdAt: at, updatedAt: at } : {}),
    },
  });
}

export async function seedWorkspaceContent(db: PrismaClient, ws: Ws, h: SeedHub) {
  await page(db, ws, {
    title: "Start here",
    content: [
      B.p(`This is ${h.name}'s workspace: every page, plan and person for the company lives here.`),
      B.h3("The idea"),
      B.quote(h.rawIdea),
      B.h3("A few ways to begin"),
      B.todo("Write down the idea in your own words", true),
      B.todo("Invite a co-founder or teammate from People"),
      B.todo("Press ⌘K to jump anywhere, or type / on a page to add blocks"),
    ],
  });
}

/** Phase 2: a few real-looking pages, nested, for the demo company. */
export async function seedTidewaterPages(db: PrismaClient, ws: Ws, idOf: IdOf) {
  const maya = idOf("maya");
  const dev = idOf("dev");
  const handbook = await page(db, ws, {
    title: "Team handbook",
    icon: "📘",
    createdById: maya,
    daysAgo: 20,
    content: [
      B.p("How Tidewater works, written down so nobody has to guess. Short on purpose; change it when it stops being true."),
      B.h2("What we're doing"),
      B.p("Packaging made from kelp grown on the same coast where the fish is landed. Local production beats plastic on total cost once logistics are counted."),
      B.h2("How we decide"),
      B.bullet("Every decision has one owner. They ask for input, then they decide."),
      B.bullet("Write it down before the meeting, not after."),
      B.bullet("Disagree in the room, commit outside it."),
    ],
  });
  await page(db, ws, {
    title: "How we meet",
    parentId: handbook.id,
    createdById: maya,
    daysAgo: 18,
    content: [
      B.p("Monday: 30 minutes, plan the week. Thursday: 45 minutes, one hard problem."),
      B.p("Notes go in Meetings. Action items become tasks before we leave the call."),
    ],
  });
  await page(db, ws, {
    title: "Brand voice",
    parentId: handbook.id,
    createdById: maya,
    daysAgo: 15,
    content: [
      B.p("Plain, coastal, practical. We talk like people who've worked a fish market at 5am."),
      B.labeled("Say:", "“Holds 48 hours on ice.”"),
      B.labeled("Don't say:", "“Revolutionary eco-solution.”"),
    ],
  });
  await page(db, ws, {
    title: "Processor interviews",
    icon: "🔍",
    createdById: dev,
    daysAgo: 9,
    content: [
      B.p("Notes from calls with seafood processors around Peniche and Nazaré."),
      B.h3("Mar Azul (Peniche)"),
      B.bullet("Spends about 11% of landed cost on packaging and freight."),
      B.bullet("Their biggest buyer asked for plastic-free trays by next spring."),
      B.quote("If it survives 48 hours on ice and doesn't smell, we'd try a pallet."),
      B.h3("Costa Fria (Nazaré)"),
      B.bullet("Worried about trays softening in wet chillers."),
      B.todo("Send Costa Fria the sample-run dates"),
    ],
  });
}

export async function seedPrivatePages(db: PrismaClient, ws: Ws, owner: string) {
  await page(db, ws, {
    title: "Ideas scratchpad",
    createdById: owner,
    daysAgo: 4,
    content: [
      B.p("Half-formed things. Nobody else can see this page."),
      B.bullet("Could the trays carry the catch's origin as a QR code?"),
      B.bullet("Talk to Rosa about the Blue Economy grant timing."),
    ],
  });
}
