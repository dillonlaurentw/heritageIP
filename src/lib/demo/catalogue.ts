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

export function recommend(axes: { aesthetic?: number; riskPosture?: number } | null, count = 4): Product[] {
  if (!axes || axes.aesthetic === undefined || axes.riskPosture === undefined) return CATALOGUE.slice(0, count);
  const { aesthetic, riskPosture } = axes;
  return [...CATALOGUE]
    .sort((a, b) => Math.hypot(a.aesthetic - aesthetic, a.risk - riskPosture) - Math.hypot(b.aesthetic - aesthetic, b.risk - riskPosture))
    .slice(0, count);
}

export const findProduct = (id: string) => CATALOGUE.find((p) => p.id === id);
