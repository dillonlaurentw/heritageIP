import { describe, expect, it } from "vitest";
import { TEXTS } from "../../data/texts";
import { FIRST_SCREEN, INSPIRATIONS, inspiration, neighbours, scatter } from "../inspirations";

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

  it("has hundreds of paintings, each with a museum image", () => {
    const art = INSPIRATIONS.filter((w) => w.kind === "art");
    expect(art.length).toBeGreaterThanOrEqual(300);
    for (const w of art) expect(w.image).toMatch(/^https:\/\/images\.metmuseum\.org\//);
    for (const w of art) expect(w.image).toMatch(/^https:\/\/(www\.artic\.edu\/iiif|images\.metmuseum\.org)\//);
  });

  it("leaves out artists whose work is still under copyright", () => {
    const names = INSPIRATIONS.filter((w) => w.kind === "art").map((w) => w.author.toLowerCase());
    for (const banned of ["picasso", "dalí", "dali", "basquiat", "duchamp"]) expect(names.some((n) => n.includes(banned))).toBe(false);
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
