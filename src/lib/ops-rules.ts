/**
 * Pure rules behind company operations: meeting action items, goal progress
 * and the weekly summary. No I/O; unit tested.
 */

export type ActionItem = { id: string; text: string; mentions: string[] };

/** Unchecked to-dos in a document, with the people @mentioned in each. */
export function actionItems(doc: unknown): ActionItem[] {
  const out: ActionItem[] = [];
  const inline = (content: unknown) => {
    const text: string[] = [];
    const mentions: string[] = [];
    const walk = (n: unknown) => {
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== "object") return;
      const o = n as Record<string, unknown>;
      if (o.type === "text" && typeof o.text === "string") text.push(o.text);
      if (o.type === "mention") {
        const id = (o.props as Record<string, unknown> | undefined)?.userId;
        if (typeof id === "string" && id) mentions.push(id);
      }
      if (o.type === "link") walk(o.content);
    };
    walk(content);
    return { text: text.join("").replace(/\s+/g, " ").trim(), mentions };
  };
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if (o.type === "checkListItem" && !(o.props as Record<string, unknown> | undefined)?.checked) {
      const { text, mentions } = inline(o.content);
      if (text) out.push({ id: String(o.id ?? ""), text: text.replace(/[\s,;:–-]+$/, ""), mentions: [...new Set(mentions)] });
    }
    if (Array.isArray(o.children)) walk(o.children);
  };
  walk(doc);
  return out;
}

const key = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Which action items still need a task: skips ones already sent (same title
 * among the meeting's tasks) and duplicates within the list. Assignees are
 * limited to people in the workspace.
 */
export function itemsToSend(items: ActionItem[], existingTitles: string[], memberIds: string[]) {
  const seen = new Set(existingTitles.map(key));
  const members = new Set(memberIds);
  const out: { title: string; assignee: string[] }[] = [];
  for (const i of items) {
    const k = key(i.text);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ title: i.text.slice(0, 200), assignee: i.mentions.filter((m) => members.has(m)) });
  }
  return out;
}

type TaskLike = { status: unknown; goal: unknown };

/** Goal id → linked tasks done / total. Tasks link to goals through the Goal relation. */
export function goalProgress(tasks: TaskLike[]) {
  const out: Record<string, { done: number; total: number }> = {};
  for (const t of tasks) {
    const goals = Array.isArray(t.goal) ? (t.goal as unknown[]).filter((g): g is string => typeof g === "string") : [];
    for (const g of goals) {
      out[g] ??= { done: 0, total: 0 };
      out[g].total += 1;
      if (t.status === "done") out[g].done += 1;
    }
  }
  return out;
}

export type WeekActivity = { kind: string; title: string; actor: string; at: Date; pageId?: string | null };

/** Group a week of activity into the sections of the weekly summary. */
export function summarizeWeek(activity: WeekActivity[]) {
  const pick = (kinds: string[]) => {
    const seen = new Set<string>();
    return activity
      .filter((a) => kinds.includes(a.kind))
      .filter((a) => {
        const k = `${a.kind}:${a.title}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  };
  const people = new Map<string, number>();
  for (const a of activity) people.set(a.actor, (people.get(a.actor) ?? 0) + 1);
  return {
    finished: pick(["row.done"]),
    created: pick(["page.created", "tasks.added", "plan.generated", "plan.step_added"]),
    meetings: pick(["meeting.actions"]),
    joined: pick(["member.joined"]),
    mostActive: [...people.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name),
  };
}

/** Monday 00:00 (local to the server) of the week containing `d`. */
export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
