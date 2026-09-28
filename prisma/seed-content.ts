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

export async function seedWorkspaceContent(db: PrismaClient, ws: Ws, h: SeedHub, idOf: IdOf) {
  void idOf;
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
