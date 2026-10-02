import { describe, expect, it } from "vitest";
import { TEXTS } from "../../data/texts";
import { FIRST_SCREEN, INSPIRATIONS, inspiration, interleave, neighbours, scatter } from "../inspirations";

describe("inspirations", () => {
  it("keeps every word at its own number", () => {
    for (const t of TEXTS) expect(inspiration(t.n)).toBe(t);
  });

  it("numbers every work once, with no gaps", () => {
    INSPIRATIONS.forEach((w, i) => expect(w.n).toBe(i + 1));
  });

  it("keeps only complete poems", () => {
    for (const t of TEXTS) {
      expect(t.kind).toBe("poem");
      expect(t.lines?.length).toBeGreaterThan(0);
      expect(t.opening).toBeUndefined();
    }
  });

  it("has hundreds of paintings, each with an image from The Met or Wikimedia Commons", () => {
    const art = INSPIRATIONS.filter((w) => w.kind === "art");
    expect(art.length).toBeGreaterThanOrEqual(800);
    for (const w of art) expect(w.image).toMatch(/^https:\/\/(images\.metmuseum\.org\/|upload\.wikimedia\.org\/wikipedia\/commons\/)/);
  });

  it("has abstract and modern work", () => {
    const names = new Set(INSPIRATIONS.filter((w) => w.kind === "art").map((w) => w.author));
    for (const painter of ["Wassily Kandinsky", "Piet Mondrian", "Henri Matisse", "Kazimir Malevich"]) expect(names.has(painter)).toBe(true);
  });

  it("only takes modern work from 1930 or earlier", () => {
    for (const w of INSPIRATIONS) if (w.kind === "art" && w.image.includes("wikimedia")) expect(Number(w.date)).toBeLessThanOrEqual(1930);
  });

  it("spreads one list evenly through another, keeping both orders", () => {
    expect(interleave<number | string>([1, 2, 3, 4], ["a", "b"])).toEqual([1, 2, "a", 3, 4, "b"]);
    expect(interleave<string>([], ["a"])).toEqual(["a"]);
    expect(interleave([1], [])).toEqual([1]);
  });

  it("leaves out artists whose work is still under copyright", () => {
    const names = INSPIRATIONS.filter((w) => w.kind === "art").map((w) => w.author.toLowerCase());
    for (const banned of ["picasso", "dalí", "dali", "basquiat", "duchamp"]) expect(names.some((n) => n.includes(banned))).toBe(false);
  });

  it("has no crucifixion scenes", () => {
    const art = INSPIRATIONS.filter((w) => w.kind === "art");
    for (const w of art) expect(w.title).not.toMatch(/crucifixion|calvary|golgotha|christ on the cross/i);
    for (const id of ["435577", "437007", "435972", "437877"]) expect(art.some((w) => w.url.endsWith(`/${id}`))).toBe(false);
  });

  it("walks to the neighbours", () => {
    expect(neighbours(1)).toEqual({ prev: undefined, next: 2 });
    expect(neighbours(INSPIRATIONS.length).next).toBeUndefined();
  });

  it("scatters the first screen clear of the words, the same every time", () => {
    const spots = scatter(FIRST_SCREEN.desktop);
    expect(spots).toHaveLength(FIRST_SCREEN.desktop);
    expect(scatter(FIRST_SCREEN.desktop)).toEqual(spots);
    for (const s of spots) expect(((s.left - 50) / 40) ** 2 + ((s.top - 50) / 20) ** 2).toBeGreaterThanOrEqual(0.99);
  });
});
