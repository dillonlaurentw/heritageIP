"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { B } from "@/lib/blocks";
import { db } from "@/lib/db";
import { sendMeetingActions, weekData } from "@/lib/ops";
import { insertPage, pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { logActivity, requireWorkspaceRole } from "@/lib/workspaces";

const id = z.string().min(1).max(64);

/** "Send action items to Tasks" on a meeting note. */
export async function sendMeetingActionsAction(meetingId: string) {
  const viewer = await requireOnboarded();
  try {
    const res = await sendMeetingActions(id.parse(meetingId), viewer);
    revalidatePath("/", "layout");
    return { ok: true as const, ...res };
  } catch (e) {
    return { ok: false as const, message: e instanceof Error && e.message !== "Not allowed." ? e.message : "Couldn't send those." };
  }
}

/** Save "This week" as an ordinary page the team can edit and share. */
export async function saveWeekAsPage(workspaceId: string) {
  const viewer = await requireOnboarded();
  const wsId = id.parse(workspaceId);
  await requireWorkspaceRole(wsId, viewer, "MEMBER");
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: wsId }, select: { slug: true } });
  const w = await weekData(wsId, ws.slug);
  const title = `Week of ${formatDate(w.since)}`;
  const list = (items: { title: string }[], empty: string) => (items.length ? items.map((i) => B.bullet(i.title)) : [B.p(empty)]);
  const content = [
    B.p("What changed this week, collected by SELF. Edit freely: this page is yours now."),
    B.h2("Done"),
    ...list(w.summary.finished, "Nothing marked done yet."),
    B.h2("New"),
    ...list(w.summary.created, "No new pages or plans."),
    ...(w.plan ? [B.h2("Game plan"), B.p(`${w.plan.done} of ${w.plan.total} steps done.`)] : []),
    ...(w.goals.length
      ? [B.h2("Goals"), ...w.goals.map((g) => B.bullet(`${g.title}${g.progress ? `: ${g.progress.done}/${g.progress.total} tasks done` : ""}`))]
      : []),
    B.h2("Coming up"),
    ...list(w.upcoming.map((t) => ({ title: `${t.title} (due ${formatDate(t.due)})` })), "Nothing due in the next seven days."),
    ...(w.overdue.length ? [B.h2("Overdue"), ...w.overdue.map((t) => B.bullet(`${t.title} (was due ${formatDate(t.due)})`))] : []),
    B.h2("Blockers"),
    B.todo(""),
  ];
  const page = await insertPage({ workspaceId: wsId, title, icon: "🗒️", content, template: "weekly" }, viewer.user.id);
  await logActivity(wsId, viewer.user.id, "page.created", page.id, { title });
  revalidatePath("/", "layout");
  return { ok: true as const, href: pageHref(ws.slug, page.id) };
}
