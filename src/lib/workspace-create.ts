import "server-only";
import { B } from "./blocks";
import { db } from "./db";
import { insertPage } from "./pages";
import { logActivity, uniqueWorkspaceSlug } from "./workspaces";

export type NewWorkspace = { name: string; oneLiner?: string | null; rawIdea?: string | null; icon?: string | null };

/**
 * Create a team workspace with its owner and a starter page. Later phases add
 * the built-in databases (tasks, game plan…) through `addStarterContent`.
 */
export async function createWorkspace(input: NewWorkspace, userId: string) {
  const ws = await db.workspace.create({
    data: {
      kind: "TEAM",
      slug: await uniqueWorkspaceSlug(input.name),
      name: input.name,
      oneLiner: input.oneLiner || null,
      rawIdea: input.rawIdea || null,
      icon: input.icon || null,
      createdById: userId,
      members: { create: { userId, role: "OWNER" } },
    },
  });
  await addStarterContent(ws.id, userId, input);
  await logActivity(ws.id, userId, "workspace.created", null, { name: ws.name });
  return ws;
}

export async function addStarterContent(workspaceId: string, userId: string, input: NewWorkspace) {
  await insertPage(
    {
      workspaceId,
      title: "Start here",
      content: [
        B.p(`This is ${input.name}'s workspace: every page, plan and person for the company lives here.`),
        ...(input.rawIdea ? [B.h3("The idea"), B.quote(input.rawIdea)] : []),
        B.h3("A few ways to begin"),
        B.todo("Write down the idea in your own words"),
        B.todo("Invite a co-founder or teammate from People"),
        B.todo("Press ⌘K to jump anywhere, or type / on a page to add blocks"),
      ],
    },
    userId,
  );
}
