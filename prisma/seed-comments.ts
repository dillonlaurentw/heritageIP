/*
 * Phase 9 demo data: comment threads (page-level and on a block), a mention,
 * and inbox rows for them, so Comments and the Inbox look lived-in.
 */
import type { PrismaClient } from "../src/generated/prisma/client";

type IdOf = (key: string) => string;
const HOUR = 3_600_000;
const ago = (h: number) => new Date(Date.now() - h * HOUR);

export async function seedComments(db: PrismaClient, idOf: IdOf) {
  const tide = await db.workspace.findUniqueOrThrow({ where: { slug: "tidewater-kelp" }, select: { id: true, slug: true } });
  const page = async (title: string) => db.page.findFirstOrThrow({ where: { workspaceId: tide.id, title, archivedAt: null }, select: { id: true, content: true } });
  const [interviews, handbook, thesis] = await Promise.all([page("Processor interviews"), page("Team handbook"), page("Thesis")]);
  const maya = idOf("maya");
  const dev = idOf("dev");
  const rosa = idOf("rosa");

  // A thread on a specific block of the interview notes.
  const quoteBlock = (interviews.content as { id: string; type: string; content?: { text?: string }[] }[]).find((b) => b.type === "quote");
  const t1 = await db.comment.create({
    data: {
      pageId: interviews.id,
      authorId: dev,
      blockId: quoteBlock?.id ?? null,
      quote: quoteBlock?.content?.map((c) => c.text ?? "").join("") ?? null,
      body: "@Maya Okonkwo this is the line I'd put on the first slide. Can we get it in writing from Mar Azul?",
      createdAt: ago(20),
    },
  });
  await db.comment.create({ data: { pageId: interviews.id, authorId: maya, parentId: t1.id, body: "Yes. I'll ask when I send the sample dates.", createdAt: ago(18) } });

  // A page-level comment from Rosa (a guest can comment).
  const t2 = await db.comment.create({
    data: { pageId: thesis.id, authorId: rosa, body: "The why-now is strong. The grant deadline makes it even sharper; worth one sentence.", createdAt: ago(6) },
  });
  // A resolved thread, so the Resolved tab isn't empty.
  await db.comment.create({
    data: { pageId: handbook.id, authorId: dev, body: "Should decisions have a written deadline too?", resolvedAt: ago(30), createdAt: ago(48) },
  });

  const href = (pageId: string, commentId: string) => `/w/${tide.slug}/${pageId}?comment=${commentId}`;
  await db.notification.createMany({
    data: [
      { userId: maya, actorId: dev, kind: "MENTION", text: "Dev Raman mentioned you in a comment on “Processor interviews”", href: href(interviews.id, t1.id), workspaceId: tide.id, pageId: interviews.id, commentId: t1.id, createdAt: ago(20) },
      { userId: maya, actorId: rosa, kind: "COMMENT", text: "Rosa Almeida commented on “Thesis”: The why-now is strong…", href: href(thesis.id, t2.id), workspaceId: tide.id, pageId: thesis.id, commentId: t2.id, createdAt: ago(6) },
      { userId: dev, actorId: maya, kind: "COMMENT", text: "Maya Okonkwo replied on “Processor interviews”: Yes. I'll ask when I send the sample dates.", href: href(interviews.id, t1.id), workspaceId: tide.id, pageId: interviews.id, commentId: t1.id, createdAt: ago(18) },
    ],
  });
  console.log("Seeded 4 comments.");
}
