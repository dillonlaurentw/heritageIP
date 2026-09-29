/* Help by area (Self3): Tidewater has go-to-market half written and a start on marketing. */
import type { PrismaClient } from "../src/generated/prisma/client";
import { writeSection } from "../src/lib/area-doc";
import { AREAS, areaSystemKey, type AreaKey } from "../src/lib/areas";
import { page } from "./seed-content";

export async function seedAreas(db: PrismaClient, idOf: (key: string) => string) {
  const ws = await db.workspace.findUniqueOrThrow({ where: { slug: "tidewater-kelp" }, select: { id: true, slug: true, name: true, createdById: true } });
  const write = async (key: AreaKey, sections: Record<string, string>, by: string) => {
    const titles = AREAS[key].sections.map((s) => s.title);
    let content: unknown[] = [];
    for (const [sk, text] of Object.entries(sections)) content = writeSection(content, titles, AREAS[key].sections.find((s) => s.key === sk)!.title, text);
    await db.page.deleteMany({ where: { workspaceId: ws.id, systemKey: areaSystemKey(key) } });
    await page(db, ws, { title: AREAS[key].name, content, systemKey: areaSystemKey(key), createdById: by, daysAgo: 2 });
  };
  await write(
    "gtm",
    {
      positioning: "Plastic-free trays that cost less than plastic, because they're made where the fish is landed.",
      customers: "Mid-size processors in Peniche and Nazaré who sell to supermarkets with a plastic-free pledge.\n- 15 interviewed; 3 letters of intent",
    },
    idOf("maya"),
  );
  await write("marketing", { voice: "- Local\n- Proven\n- Plain-spoken\nNever: “revolutionary”, “eco-warrior”, “disrupting seafood”." }, idOf("maya"));
}
