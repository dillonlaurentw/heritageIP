/**
 * Self's inspirations: words (src/data/texts.ts) and paintings in one
 * numbered list, plus where the numbers sit on the home page. Pure.
 *
 * Paintings come from two files: The Met's (src/data/artworks.json, built by
 * scripts/build-collection.mjs) and modern and abstract work from Wikimedia
 * Commons (src/data/modern.json, built by scripts/build-modern.mjs), mixed
 * evenly. Words keep the numbers they're given; paintings fill every other
 * number.
 */
import artworks from "../data/artworks.json";
import modern from "../data/modern.json";
import { TEXTS } from "../data/texts";

export type TextWork = {
  n: number;
  title: string;
  author: string;
  /** Book or source and year, shown under the work. */
  credit: string;
  kind: "poem" | "prose" | "blank";
  /** The work. For a poem, one entry per line ("" for a stanza break). */
  lines?: string[];
  /** Shown instead of `lines` when the full text can't be published. */
  opening?: string;
};

export type ArtWork = {
  n: number;
  kind: "art";
  title: string;
  author: string;
  date: string;
  medium: string;
  image: string;
  alt: string;
  /** The museum the image comes from. */
  credit: string;
  url: string;
};

export type Inspiration = TextWork | ArtWork;

type ArtRecord = { title: string; artist: string; date: string; medium: string; image: string; alt: string; museum: string; url: string };

/** Spreads `b` evenly through `a`, keeping the order of each. */
export function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const total = a.length + b.length;
  let i = 0;
  let j = 0;
  for (let k = 0; k < total; k++) {
    const bDue = Math.floor(((k + 1) * b.length) / total) > j;
    if (j < b.length && (bDue || i >= a.length)) out.push(b[j++]);
    else out.push(a[i++]);
  }
  return out;
}

function assemble(): Inspiration[] {
  const words = new Map(TEXTS.map((t) => [t.n, t]));
  const lastWord = Math.max(...TEXTS.map((t) => t.n));
  const art = interleave(artworks as ArtRecord[], modern as ArtRecord[]);
  const out: Inspiration[] = [];
  let next = 0;
  for (let n = 1; next < art.length || n <= lastWord; n++) {
    const w = words.get(n);
    if (w) out.push(w);
    else if (next < art.length) {
      const a = art[next++];
      out.push({ n, kind: "art", title: a.title, author: a.artist, date: a.date, medium: a.medium, image: a.image, alt: a.alt, credit: a.museum, url: a.url });
    }
  }
  return out;
}

export const INSPIRATIONS: Inspiration[] = assemble();

const BY_N = new Map(INSPIRATIONS.map((i) => [i.n, i]));

export function inspiration(n: number): Inspiration | undefined {
  return BY_N.get(n);
}

/** The numbers either side, for wandering from one work to the next. */
export function neighbours(n: number): { prev?: number; next?: number } {
  const i = INSPIRATIONS.findIndex((w) => w.n === n);
  return { prev: INSPIRATIONS[i - 1]?.n, next: INSPIRATIONS[i + 1]?.n };
}

/** How many numbers float around the words on the first screen. */
export const FIRST_SCREEN = { phone: 24, desktop: 60 };

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

/**
 * Spots (percent of the first screen) for the numbers around the words:
 * steady from visit to visit, clear of the words in the middle, and spread
 * out so they don't touch. The first `phone` spots are spread on their own,
 * so phones can show just those.
 */
export function scatter(count = FIRST_SCREEN.desktop): { left: number; top: number }[] {
  const rand = seeded(11);
  const spots: { left: number; top: number }[] = [];
  let minGap = 11;
  while (spots.length < count) {
    let placed = false;
    for (let tries = 0; tries < 400 && !placed; tries++) {
      const left = 5 + rand() * 90;
      const top = 6 + rand() * 88;
      const inClearing = ((left - 50) / 40) ** 2 + ((top - 50) / 20) ** 2 < 1;
      const crowded = spots.some((s) => Math.hypot(s.left - left, s.top - top) < minGap);
      if (!inClearing && !crowded) {
        spots.push({ left: Math.round(left * 10) / 10, top: Math.round(top * 10) / 10 });
        placed = true;
      }
    }
    if (!placed) minGap *= 0.92;
  }
  return spots;
}

/** A small steady nudge for each number in the field below, so it reads as scattered, not as a table. */
export function jitter(n: number): { x: number; y: number; scale: number } {
  const rand = seeded(n * 7919 + 3);
  rand();
  return {
    x: Math.round((rand() - 0.5) * 200) / 100,
    y: Math.round((rand() - 0.5) * 220) / 100,
    scale: Math.round((0.8 + rand() * 0.45) * 100) / 100,
  };
}
