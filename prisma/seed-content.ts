/*
 * Pages and databases inside each demo workspace. Grows phase by phase.
 * No server-only imports here: the seed runs in plain Node.
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import type { Prisma } from "../src/generated/prisma/client";
import { B, blocksToText } from "../src/lib/blocks";
import { SYSTEM_DBS, SYSTEM_RELATIONS, type SystemKey } from "../src/lib/system-dbs";
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
  await seedSystemDb(
    db,
    ws,
    "tasks",
    [
      { title: "Book the kelp press for a 5,000-tray sample run", props: { status: "doing", assignee: [maya], due: dateIn(3), priority: "high" } },
      { title: "Send Costa Fria the sample-run dates", props: { status: "todo", assignee: [dev], due: dateIn(1), priority: "medium" } },
      { title: "Draft the food-contact test plan", props: { status: "todo", assignee: [dev], due: dateIn(6), priority: "high" } },
      { title: "Shortlist two packaging designers", props: { status: "todo", assignee: [maya], due: dateIn(9), priority: "low" } },
      { title: "Price the landed cost per kilo for Mar Azul", props: { status: "done", assignee: [maya], due: dateIn(-4), priority: "high" } },
      { title: "Set up the shared drive and handbook", props: { status: "done", assignee: [dev], due: dateIn(-10), priority: "low" } },
    ],
    { createdById: maya },
  );
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

/** Create a built-in database (Tasks, Game plan…) with rows. Returns ids by row key. */
export async function seedSystemDb(
  db: PrismaClient,
  ws: Ws,
  key: SystemKey,
  rows: { key?: string; title: string; props?: Record<string, unknown>; content?: unknown[]; createdById?: string; daysAgo?: number }[],
  opts: { parentId?: string | null; createdById?: string } = {},
) {
  const def = SYSTEM_DBS[key];
  const dbPage = await page(db, ws, {
    title: def.title,
    icon: def.icon,
    kind: "DATABASE",
    schema: structuredClone(def.schema),
    systemKey: key,
    content: [B.p(def.description)],
    parentId: opts.parentId ?? null,
    createdById: opts.createdById,
  });
  await db.databaseView.createMany({
    data: def.views.map((v, i) => ({ databaseId: dbPage.id, name: v.name, type: v.type, config: v.config as Prisma.InputJsonValue, position: i })),
  });
  const ids: Record<string, string> = {};
  for (const r of rows) {
    const row = await page(db, ws, {
      title: r.title,
      kind: "ROW",
      parentId: dbPage.id,
      props: r.props ?? {},
      content: r.content ?? [],
      createdById: r.createdById ?? opts.createdById,
      daysAgo: r.daysAgo,
    });
    ids[r.key ?? r.title] = row.id;
  }
  return { id: dbPage.id, rows: ids };
}

/** Point built-in relations at each other (Tasks → Goals, Roles → Game plan…). */
export async function linkRelations(db: PrismaClient, wsId: string) {
  const systems = await db.page.findMany({ where: { workspaceId: wsId, systemKey: { in: Object.keys(SYSTEM_DBS) } }, select: { id: true, systemKey: true, schema: true } });
  const byKey = new Map(systems.map((s) => [s.systemKey, s]));
  for (const rel of SYSTEM_RELATIONS) {
    const from = byKey.get(rel.from);
    const to = byKey.get(rel.to);
    if (!from || !to) continue;
    const schema = from.schema as { properties: { id: string; relation?: { databaseId: string } }[] };
    const prop = schema.properties.find((p) => p.id === rel.prop);
    if (prop) prop.relation = { databaseId: to.id };
    await db.page.update({ where: { id: from.id }, data: { schema: schema as Prisma.InputJsonValue } });
  }
}

export const dateIn = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
