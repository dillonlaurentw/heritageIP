#!/usr/bin/env node
/**
 * Builds src/data/artworks.json: public-domain artworks with images from the
 * Art Institute of Chicago and The Met, for the inspirations on the Self home
 * page. Run it again to refresh; the order is stable, so numbers keep pointing
 * at the same works as long as the museums keep them.
 *
 *   node scripts/build-collection.mjs
 *
 * Only paintings each museum marks public domain (AIC `is_public_domain`,
 * Met `isPublicDomain`) are kept, and only those whose image actually loads
 * (each image is requested; the run stops if the image servers can't be
 * reached at all). Artists still under copyright (Picasso,
 * Duchamp, Dalí, Basquiat and most of Matisse) have nothing released by
 * either museum, so they don't appear.
 *
 * Uses curl so it works behind proxies that Node's fetch ignores.
 */
import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import { promisify } from "node:util";

const run = promisify(execFile);
const UA = "Self site (forself.xyz)";

async function curlJson(args) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { stdout } = await run("curl", ["-sS", "-m", "40", "-H", `AIC-User-Agent: ${UA}`, "-A", UA, ...args], { maxBuffer: 64 * 1024 * 1024 });
      return JSON.parse(stdout);
    } catch {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Art Institute of Chicago: artist → how many works at most. */
const AIC_ARTISTS = {
  "Vincent van Gogh": 40,
  "Claude Monet": 50,
  "Henri Matisse": 10,
  "Paul Cézanne": 40,
  "Edgar Degas": 50,
  "Paul Gauguin": 45,
  "Georges Seurat": 15,
  "Gustav Klimt": 5,
  "Vasily Kandinsky": 10,
  "Katsushika Hokusai": 50,
  "Pierre-Auguste Renoir": 45,
  "Henri de Toulouse-Lautrec": 45,
  "Édouard Manet": 45,
  "Camille Pissarro": 40,
  "Gustave Caillebotte": 5,
  "Mary Cassatt": 40,
  "Berthe Morisot": 20,
  "Edvard Munch": 40,
  "Amedeo Modigliani": 15,
  "Egon Schiele": 3,
  "Piet Mondrian": 10,
  "Utagawa Hiroshige": 50,
  "Odilon Redon": 40,
  "Henri Rousseau": 6,
  "Alfred Sisley": 10,
  "James McNeill Whistler": 40,
  "Winslow Homer": 40,
  "John Singer Sargent": 25,
  "Gustave Courbet": 12,
  "Eugène Delacroix": 30,
  "Rembrandt van Rijn": 45,
  "Francisco José de Goya y Lucientes": 45,
  "Auguste Rodin": 15,
  "Georges Braque": 5,
  "Juan Gris": 5,
};

/** The Met: extra paintings by the best-known names. */
const MET_ARTISTS = {
  "Vincent van Gogh": 30,
  "Claude Monet": 30,
  "Paul Cézanne": 25,
  "Johannes Vermeer": 10,
  "Georges Seurat": 15,
  "Gustav Klimt": 5,
  "Pierre-Auguste Renoir": 20,
  "Édouard Manet": 20,
  "Paul Gauguin": 20,
  "Edgar Degas": 25,
  "Rembrandt": 15,
  "Jacques Louis David": 8,
  "J. M. W. Turner": 10,
};

const RANK = { painting: 0, drawing: 1, "work on paper": 2, print: 3 };
const rank = (c) => RANK[(c ?? "").toLowerCase()] ?? ((c ?? "").toLowerCase().includes("paint") ? 0 : 4);
const plain = (s) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function aic(artist, cap) {
  const out = [];
  for (let page = 1; page <= 3; page++) {
    const body = {
      query: {
        bool: {
          must: [
            { term: { is_public_domain: true } },
            { exists: { field: "image_id" } },
            { match_phrase: { artist_title: artist } },
            { term: { "artwork_type_title.keyword": "Painting" } },
          ],
        },
      },
      fields: ["id", "title", "artist_title", "date_display", "image_id", "classification_title", "medium_display", "is_boosted", "thumbnail"],
      limit: 100,
      page,
    };
    const j = await curlJson(["-X", "POST", "https://api.artic.edu/api/v1/artworks/search", "-H", "Content-Type: application/json", "-d", JSON.stringify(body)]);
    const data = j?.data ?? [];
    const surname = plain(artist.split(" ").at(-1));
    out.push(...data.filter((d) => d.image_id && plain(d.artist_title).includes(surname)));
    if (data.length < 100) break;
    await sleep(600);
  }
  out.sort((a, b) => Number(b.is_boosted) - Number(a.is_boosted) || rank(a.classification_title) - rank(b.classification_title) || a.id - b.id);
  return out.slice(0, cap).map((d) => ({
    key: `aic:${d.id}`,
    title: d.title,
    artist: d.artist_title,
    date: d.date_display ?? "",
    medium: d.medium_display ?? "",
    image: `https://www.artic.edu/iiif/2/${d.image_id}/full/843,/0/default.jpg`,
    alt: d.thumbnail?.alt_text ?? "",
    museum: "Art Institute of Chicago",
    url: `https://www.artic.edu/artworks/${d.id}`,
  }));
}

async function pool(items, size, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
      }
    }),
  );
  return results;
}

async function met(artist, cap) {
  const ids = [];
  for (let offset = 0; offset < 600; offset += 100) {
    const j = await curlJson([
      `https://collectionapi.metmuseum.org/public/collection/v1.1/search?q=${encodeURIComponent(artist)}&artistOrCulture=true&hasImages=true&limit=100&offset=${offset}`,
    ]);
    const batch = j?.objectIDs ?? [];
    ids.push(...batch);
    if (batch.length < 100) break;
  }
  const surname = plain(artist.split(" ").at(-1));
  const objs = await pool(ids, 8, (id) => curlJson([`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`]));
  const kept = objs.filter((o) => o?.isPublicDomain && o.primaryImageSmall && o.classification === "Paintings" && plain(o.artistDisplayName).includes(surname));
  kept.sort((a, b) => Number(b.isHighlight) - Number(a.isHighlight) || rank(a.classification) - rank(b.classification) || a.objectID - b.objectID);
  return kept.slice(0, cap).map((o) => ({
    key: `met:${o.objectID}`,
    title: o.title,
    artist: o.artistDisplayName,
    date: o.objectDate ?? "",
    medium: o.medium ?? "",
    image: o.primaryImageSmall,
    alt: "",
    museum: "The Metropolitan Museum of Art",
    url: o.objectURL || `https://www.metmuseum.org/art/collection/search/${o.objectID}`,
  }));
}

/** A steady shuffle, so neighbouring numbers jump between artists. */
function shuffle(list, seed = 7) {
  const a = [...list];
  let s = seed;
  const rand = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const all = [];
for (const [artist, cap] of Object.entries(AIC_ARTISTS)) {
  const works = await aic(artist, cap);
  console.log(`AIC  ${String(works.length).padStart(3)}  ${artist}`);
  all.push(...works);
  await sleep(600);
}
for (const [artist, cap] of Object.entries(MET_ARTISTS)) {
  const works = await met(artist, cap);
  console.log(`Met  ${String(works.length).padStart(3)}  ${artist}`);
  all.push(...works);
}

const seen = new Set();
let unique = all.filter((w) => !seen.has(w.key) && seen.add(w.key));

/** Keeps only works whose image actually loads (an image comes back, HTTP 200). */
async function imageLoads(url) {
  try {
    const { stdout } = await run("curl", ["-sS", "-m", "30", "-o", "/dev/null", "-r", "0-1023", "-A", UA, "-w", "%{http_code} %{content_type}", url]);
    const [code, type = ""] = stdout.trim().split(" ");
    return { reached: code !== "000", ok: (code === "200" || code === "206") && type.startsWith("image/") };
  } catch {
    return { reached: false, ok: false };
  }
}
const checks = await pool(unique, 8, (w) => imageLoads(w.image));
if (!checks.some((c) => c.reached)) {
  console.error("\nCouldn't reach the museums' image servers, so no image was checked. Nothing written.");
  console.error("Allow www.artic.edu and images.metmuseum.org, then run this again.");
  process.exit(1);
}
const before = unique.length;
unique = unique.filter((_, i) => checks[i].ok);
console.log(`\nImages checked: ${unique.length} of ${before} load.`);
const ordered = shuffle(unique.sort((a, b) => a.key.localeCompare(b.key)));
writeFileSync(new URL("../src/data/artworks.json", import.meta.url), JSON.stringify(ordered, null, 1) + "\n");
console.log(`\n${ordered.length} artworks written to src/data/artworks.json`);
