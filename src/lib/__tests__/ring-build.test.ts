import { describe, expect, it } from "vitest";
import { buildRing, type RingInput } from "../ring-build";

const base: RingInput = { viewerId: "me", slug: "tide", members: [], roles: [], signals: [], openSteps: [] };
const sig = (over: Partial<RingInput["signals"][number]>): RingInput["signals"][number] => ({
  id: "s1",
  kind: "PARTNER_INTRO",
  status: "PENDING",
  fromUserId: "me",
  fromName: "Maya",
  toUserId: "x",
  toName: "X",
  partner: { slug: "harbor", name: "Harbor & Vine" },
  pageId: null,
  ...over,
});

describe("buildRing", () => {
  it("leaves the viewer out and puts guests with the advisors", () => {
    const nodes = buildRing({
      ...base,
      members: [
        { userId: "me", name: "Maya", role: "OWNER", title: null },
        { userId: "dev", name: "Dev", role: "ADMIN", title: "Co-founder" },
        { userId: "rosa", name: "Rosa", role: "GUEST", title: "Mentor" },
      ],
    });
    expect(nodes.map((n) => [n.name, n.theme])).toEqual([
      ["Dev", "COFOUNDERS"],
      ["Rosa", "ADVISORS"],
    ]);
  });

  it("shows accepted intros as linked and pending ones as pending; ignores declined", () => {
    const nodes = buildRing({
      ...base,
      signals: [
        sig({ id: "a", status: "ACCEPTED" }),
        sig({ id: "b", partner: { slug: "north", name: "Northloop" } }),
        sig({ id: "c", status: "DECLINED", partner: { slug: "gone", name: "Gone" } }),
      ],
    });
    expect(nodes.map((n) => [n.name, n.state])).toEqual([
      ["Harbor & Vine", "linked"],
      ["Northloop", "pending"],
    ]);
  });

  it("opens one chair per need on unfinished steps, unless someone was already asked for that step", () => {
    const nodes = buildRing({
      ...base,
      openSteps: [
        { id: "st1", title: "Form the company", needs: ["LEGAL"] },
        { id: "st2", title: "Contracts", needs: ["LEGAL"] },
        { id: "st3", title: "Find a lab", needs: ["SUPPLIER"] },
      ],
      signals: [sig({ pageId: "st3" })],
    });
    const open = nodes.filter((n) => n.state === "open");
    expect(open.map((n) => n.name)).toEqual(["A legal partner"]);
    expect(open[0]!.href).toContain("step=st1");
  });

  it("prefers an open role over a generic co-founder chair", () => {
    const nodes = buildRing({
      ...base,
      roles: [{ id: "r1", title: "Brand and story", advisor: false, href: "/r1", interested: 2 }],
      openSteps: [{ id: "st", title: "Find a brand co-founder", needs: ["COFOUNDER"] }],
    });
    expect(nodes.map((n) => [n.name, n.note])).toEqual([["Brand and story", "open role · 2 interested"]]);
  });

  it("keeps the strongest state when the same person shows up twice", () => {
    const nodes = buildRing({
      ...base,
      members: [{ userId: "rosa", name: "Rosa", role: "GUEST", title: "Mentor" }],
      signals: [sig({ kind: "MENTOR_REQUEST", toUserId: "rosa", toName: "Rosa", partner: null })],
    });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.state).toBe("linked");
  });
});
