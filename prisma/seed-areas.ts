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

/* One what-if check already on file for Tidewater. */
export async function seedWhatIf(db: PrismaClient, idOf: (key: string) => string) {
  const ws = await db.workspace.findUniqueOrThrow({ where: { slug: "tidewater-kelp" }, select: { id: true } });
  await db.agentThread.deleteMany({ where: { workspaceId: ws.id, kind: "whatif" } });
  const step = (title: string) => db.page.findFirst({ where: { workspaceId: ws.id, kind: "ROW", title, parent: { systemKey: "gamePlan" } }, select: { id: true, title: true } });
  const [press, cert] = await Promise.all([step("Contract a local kelp press"), step("Food-contact certification")]);
  const slips = [press && { stepId: press.id, title: press.title, effect: "Slips by [WEEKS]" }, cert && { stepId: cert.id, title: cert.title, effect: "Waits on new samples" }].filter(Boolean);
  const maya = idOf("maya");
  const thread = await db.agentThread.create({ data: { workspaceId: ws.id, userId: maya, kind: "whatif" } });
  await db.agentMessage.create({
    data: {
      threadId: thread.id,
      role: "AGENT",
      text: "What if: The Blue Economy grant is three months late",
      createdAt: new Date(Date.now() - 86_400_000),
      data: {
        type: "whatif",
        by: maya,
        scenario: "The Blue Economy grant is three months late",
        demo: true,
        applied: [],
        output: {
          summary: "The grant pays for the press's first run, so a late grant pushes production, and the pilot follows. Deciding now what you'd do costs little.",
          slips,
          themes: [
            { theme: "PARTNERS", note: "Northloop would need to hold the slot or you'd need a smaller first run." },
            { theme: "ADVISORS", note: "Rosa knows the grant timeline; ask her what's realistic." },
          ],
          money: "Costs keep running while you wait, so your runway shrinks by about [AMOUNT] a month of delay.",
          changes: [
            { title: "Ask Northloop for a smaller first run", detail: "So production doesn't wait for the whole grant.", stage: "BUILD", needs: ["SUPPLIER"] },
            { title: "Ask Rosa for the realistic grant date", detail: "Plan to her date, not the official one.", stage: "SETUP", needs: ["MENTOR"] },
          ],
        },
      },
    },
  });
}
