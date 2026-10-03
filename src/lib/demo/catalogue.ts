// Cadence Outdoor's (fictional) catalogue. Each product has a feel on two of
// the Self axes, 0–100: aesthetic (restrained → expressive) and riskPosture
// (protective → adventurous). Recommendations rank by closeness to the
// person's Self, so two people see genuinely different picks.
export type Product = { id: string; name: string; detail: string; price: number; aesthetic: number; risk: number };

export const CATALOGUE: Product[] = [
  { id: "jkt-wax", name: "Waxed canvas jacket", detail: "Olive, hand-finished", price: 240, aesthetic: 20, risk: 45 },
  { id: "sock-wool", name: "Wool trail socks", detail: "Undyed", price: 28, aesthetic: 10, risk: 30 },
  { id: "pack-leather", name: "Leather day pack", detail: "Tan", price: 180, aesthetic: 30, risk: 25 },
  { id: "base-merino", name: "Merino base layer", detail: "Charcoal", price: 95, aesthetic: 15, risk: 55 },
  { id: "shell-neon", name: "Storm shell", detail: "Electric orange", price: 320, aesthetic: 90, risk: 85 },
  { id: "tent-ultra", name: "Ultralight tent", detail: "One person, 900g", price: 450, aesthetic: 50, risk: 95 },
  { id: "pole-carbon", name: "Carbon trekking poles", detail: "Neon accents", price: 140, aesthetic: 75, risk: 80 },
  { id: "flask-print", name: "Printed flask", detail: "Bold geometric print", price: 35, aesthetic: 85, risk: 40 },
  { id: "boot-classic", name: "Classic leather boots", detail: "Resoleable", price: 260, aesthetic: 25, risk: 60 },
  { id: "rope-climb", name: "Climbing rope", detail: "60m dynamic", price: 210, aesthetic: 60, risk: 100 },
];

const words = (text: string) => new Set(text.toLowerCase().match(/[a-z]{4,}/g) ?? []);

// Learned taste nudges the ranking: products sharing words with what the
// person avoids drop, with what they like rise.
function tasteNudge(p: Product, taste: { likes: string[]; avoids: string[] } | null) {
  if (!taste) return 0;
  const text = words(`${p.name} ${p.detail}`);
  const hits = (phrases: string[]) => phrases.reduce((n, phrase) => n + [...words(phrase)].filter((w) => text.has(w)).length, 0);
  return hits(taste.avoids) * 30 - hits(taste.likes) * 15;
}

export function recommend(
  axes: { aesthetic?: number; riskPosture?: number } | null,
  taste: { likes: string[]; avoids: string[] } | null = null,
  count = 4,
): Product[] {
  if (!axes || axes.aesthetic === undefined || axes.riskPosture === undefined) return CATALOGUE.slice(0, count);
  const { aesthetic, riskPosture } = axes;
  const score = (p: Product) => Math.hypot(p.aesthetic - aesthetic, p.risk - riskPosture) + tasteNudge(p, taste);
  return [...CATALOGUE].sort((a, b) => score(a) - score(b)).slice(0, count);
}

export const findProduct = (id: string) => CATALOGUE.find((p) => p.id === id);
