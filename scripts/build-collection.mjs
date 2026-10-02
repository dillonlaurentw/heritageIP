#!/usr/bin/env node
/**
 * Builds src/data/artworks.json: public-domain paintings from The Met, for
 * the inspirations on the Self home page. Run it again to refresh:
 *
 *   node scripts/build-collection.mjs
 *
 * Only paintings The Met marks public domain (`isPublicDomain`) are kept,
 * and only those whose image actually loads: every image is requested and
 * anything that doesn't come back as an image is dropped. The run stops if
 * the image server can't be reached at all.
 *
 * Why only The Met: its images load from anywhere. The Art Institute of
 * Chicago's image server sits behind bot protection that blocked even a
 * real browser in testing, so its images can't be promised to load.
 * Artists still under copyright (Picasso, Duchamp, Dalí, Basquiat, most of
 * Matisse) have nothing released, so they don't appear.
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
      const { stdout } = await run("curl", ["-sS", "-m", "40", "-A", UA, ...args], { maxBuffer: 64 * 1024 * 1024 });
      return JSON.parse(stdout);
    } catch {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The Met: painter → how many paintings at most. */
const MET_ARTISTS = {
  "Vincent van Gogh": 30,
  "Claude Monet": 30,
  "Paul Cézanne": 30,
  "Edgar Degas": 30,
  "Pierre-Auguste Renoir": 25,
  "Édouard Manet": 25,
  "Paul Gauguin": 20,
  "Georges Seurat": 15,
  "Camille Pissarro": 20,
  "Alfred Sisley": 15,
  "Berthe Morisot": 10,
  "Mary Cassatt": 15,
  "Henri de Toulouse-Lautrec": 10,
  "Gustav Klimt": 5,
  "Odilon Redon": 10,
  "Henri Rousseau": 5,
  "Johannes Vermeer": 10,
  "Rembrandt": 20,
  "Frans Hals": 10,
  "Peter Paul Rubens": 15,
  "Anthony van Dyck": 15,
  "Pieter Bruegel the Elder": 3,
  "Albrecht Dürer": 5,
  "Hans Holbein the Younger": 8,
  "El Greco": 10,
  "Diego Velázquez": 8,
  "Francisco de Goya": 15,
  "Titian": 10,
  "Raphael": 5,
  "Botticelli": 5,
  "Fra Angelico": 5,
  "Jean-Honoré Fragonard": 10,
  "Antoine Watteau": 5,
  "François Boucher": 10,
  "Jacques Louis David": 8,
  "Jean Auguste Dominique Ingres": 8,
  "Eugène Delacroix": 10,
  "Gustave Courbet": 20,
  "Camille Corot": 20,
  "Jean-François Millet": 10,
  "J. M. W. Turner": 10,
  "John Constable": 10,
  "Thomas Gainsborough": 10,
  "Winslow Homer": 20,
  "John Singer Sargent": 25,
  "James McNeill Whistler": 10,
  "Thomas Eakins": 15,
  "Frederic Edwin Church": 10,
  "Albert Bierstadt": 10,
  "Thomas Cole": 10,
  "Childe Hassam": 15,
  "Katsushika Hokusai": 10,
  "Utagawa Hiroshige": 5,
};

const RANK = { painting: 0, drawing: 1, "work on paper": 2, print: 3 };
const rank = (c) => RANK[(c ?? "").toLowerCase()] ?? ((c ?? "").toLowerCase().includes("paint") ? 0 : 4);
const plain = (s) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

/**
 * No full nudity: anything The Met tags as a nude, or whose title points to
 * one. A visual pass over the result catches what slips through (EXCLUDE).
 */
const NUDE_TITLE =
  /\b(nude|nudes|naked|bather|bathers|bathing|the bath|after the bath|toilette|odalisque|venus|leda|dana[eë]|susanna|andromeda|nymphs?|satyrs?|bacchanal|bacchus|three graces|judgment of paris|lucretia|cupid and psyche|mars and venus|adam and eve|diana|actaeon|galatea|europa|sleeping woman|reclining woman|woman drying)\b/i;
const EXCLUDE = new Set([
  747559, // Delacroix, Male Academy Figure
  436949, // Manet, copy after Delacroix's "Bark of Dante"
  437919, // Van Dyck, Two Tritons at the Feast of Acheloüs
  437439, // Renoir, A Young Girl with Daisies
  436180, // Delacroix, The Natchez
  436261, // Van Dyck, Virgin and Child (nursing)
  437523, // Rubens, Atalanta and Meleager
  436950, // Manet, The Dead Christ with Angels
  437837, // Toulouse-Lautrec, The Sofa
  435977, // Corot, Mother and Child (nursing)
  438821, // Gauguin, Ia Orana Maria
  // No crucifixion scenes (Christ on the cross).
  435577, // Fra Angelico, The Crucifixion
  437007, // Fra Angelico, The Crucifixion
  435972, // Corot, Honfleur: Calvary (roadside crucifix)
  437877, // Vermeer, Allegory of the Catholic Faith (crucifixion on the wall)
]);

/** Crucifixion scenes, by title. */
const CRUCIFIXION_TITLE = /\b(crucifixion|crucified|calvary|golgotha|christ on the cross|descent from the cross|deposition)\b/i;

/** Images that didn't load reliably when each was opened in a real browser. */
const UNRELIABLE = new Set([
  435866, 435872, 435874, 435876, 436017, 436179, 436253, 436322, 436442, 436545, 436819, 436949, 437300, 437527, 437542, 437830, 438009, 438815,
]);
function showsNudity(o) {
  if (EXCLUDE.has(o.objectID) || UNRELIABLE.has(o.objectID)) return true;
  if ((o.tags ?? []).some((t) => /nude/i.test(t.term ?? ""))) return true;
  return NUDE_TITLE.test(o.title ?? "") || CRUCIFIXION_TITLE.test(o.title ?? "");
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
  const surname = plain(artist.replace(/ the (elder|younger)$/i, "")).split(" ").at(-1);
  const objs = await pool(ids, 8, (id) => curlJson([`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`]));
  const kept = objs.filter(
    (o) => o?.isPublicDomain && o.primaryImageSmall && o.classification === "Paintings" && plain(o.artistDisplayName).includes(surname) && !showsNudity(o),
  );
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
