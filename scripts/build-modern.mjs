#!/usr/bin/env node
/**
 * Builds src/data/modern.json: public-domain paintings from Wikidata, with
 * images on Wikimedia Commons. This is where the abstract and modern work
 * comes from (Kandinsky, Mondrian, Matisse, Klee, Malevich…), which The Met
 * doesn't release. Run it again to refresh:
 *
 *   node scripts/build-modern.mjs
 *
 * What counts as public domain here, to be safe in the US and in Europe:
 * the painter died in 1955 or earlier (life + 70 years) AND the painting is
 * dated 1930 or earlier (US: published before 1931). Picasso, Dalí, Duchamp,
 * Basquiat and anyone else still under copyright are never queried.
 *
 * No full nudity and no crucifixion scenes: Wikidata genre/depicts and title
 * words drop the obvious ones; EXCLUDE holds what a look at every image
 * caught. Every image is requested and anything that doesn't load is
 * dropped; UNRELIABLE holds what failed in a real browser.
 *
 * Uses curl so it works behind proxies that Node's fetch ignores.
 */
import { execFile } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { promisify } from "node:util";

const run = promisify(execFile);
const UA = "SelfSite/1.0 (https://forself.xyz) curl";
/** A standard Wikimedia thumbnail width (others are refused). */
const WIDTH = 960;

/** Wikidata id → [name as shown, how many paintings at most]. Most-linked works first. */
const ARTISTS = {
  Q61064: ["Wassily Kandinsky", 50],
  Q151803: ["Piet Mondrian", 40],
  Q5589: ["Henri Matisse", 40],
  Q130777: ["Kazimir Malevich", 30],
  Q33978: ["Robert Delaunay", 25],
  Q44054: ["Franz Marc", 25],
  Q33981: ["August Macke", 25],
  Q151152: ["Juan Gris", 25],
  Q436267: ["Hilma af Klint", 26],
  Q157183: ["Fernand Léger", 20],
  Q259594: ["Lyubov Popova", 20],
  Q270460: ["Olga Rozanova", 15],
  Q152797: ["Umberto Boccioni", 15],
  Q156426: ["Alexej von Jawlensky", 15],
  Q160422: ["Theo van Doesburg", 15],
  Q152233: ["El Lissitzky", 8],
  Q297137: ["Mikalojus Konstantinas Čiurlionis", 4],
  Q2344742: ["Morgan Russell", 3],
  Q709461: ["Arthur Dove", 15],
  Q553259: ["Marsden Hartley", 12],
  Q1347418: ["Joseph Stella", 8],
  Q711903: ["Albert Gleizes", 15],
  Q156272: ["André Derain", 15],
  Q45205: ["Raoul Dufy", 12],
  Q41406: ["Edvard Munch", 25],
  Q34661: ["Gustav Klimt", 15],
  Q120993: ["Amedeo Modigliani", 12],
  Q229272: ["Ernst Ludwig Kirchner", 10],
  Q26408: ["Pierre Bonnard", 12],
  Q239394: ["Édouard Vuillard", 12],
  Q151573: ["Paul Signac", 15],
  Q154349: ["Odilon Redon", 10],
  Q156386: ["Henri Rousseau", 10],
  Q380706: ["Vilhelm Hammershøi", 10],
  Q464016: ["Marianne von Werefkin", 10],
  Q234370: ["Paula Modersohn-Becker", 8],
  Q170068: ["Akseli Gallen-Kallela", 8],
  // The famous ones The Met doesn't hold (Starry Night, Water Lilies…).
  Q5582: ["Vincent van Gogh", 40],
  Q296: ["Claude Monet", 30],
  Q35548: ["Paul Cézanne", 15],
  Q37693: ["Paul Gauguin", 12],
  Q34013: ["Georges Seurat", 8],
};
const NEVER = /picasso|dal[ií]|duchamp|basquiat/i;

/** The Met's own works come from build-collection.mjs. */
const MET = "Q160236";

const NUDE =
  /\b(nude|nudes|nudity|naked|bather|bathers|bathing|the bath|toilette|odalisque|venus|leda|dana[eë]|susanna|nymphs?|satyrs?|bacchanal|three graces|adam and eve|diana|eros|erotic|sexual|reclining|akt|nu|nue|nus|baigneuses?|aktstudie|female body|breast)\b/i;
const CRUCIFIXION = /\b(crucifixion|crucifix|crucified|calvary|golgotha|christ on the cross|carrying the cross|descent from the cross|deposition|kreuzigung|golgatha)\b/i;

/** Hand-checked after looking at every image (Wikidata ids). */
const EXCLUDE = new Set([
  "Q55709306", // Morgan Russell: photo of a gallery wall, not the painting
  "Q19883512", // Klimt, Hope II (bare breasts)
  "Q17495668", // Redon (nude figure)
  "Q55663537", // Macke, Woman supporting a flower bowl (topless)
  "Q16826765", // Munch, Christmas in the Brothel
  "Q17001535", // Klimt, Death and Life (nude figures)
  "Q29950815", // Matisse, figure on ornamental background (nude)
  "Q104425176", // Vuillard (reclining nude statue)
  "Q70588012", // Derain, The Dance (topless figures)
  "Q106769185", // Redon (nude figures)
  "Q130544604", // Popova (cubist figure, likely a nude model)
  "Q125374890", // Matisse (nude figures in landscape)
  "Q3793426", // Redon, The Cyclops (reclining nude)
  "Q3541051", // Gallen-Kallela, Lemminkäinen's Mother (nude body)
  "Q62589873", // Gallen-Kallela (nude figure)
  "Q18891040", // Munch (nude woman)
  "Q2872722", // Gauguin self-portrait (nude painting behind)
  "Q9162690", // Gauguin, Self-Portrait with the Yellow Christ (crucifixion)
  "Q18891424", // Munch, Woman in Three Stages (nude)
  "Q20276058", // Stella (nude figure)
  "Q20438050", // Derain, Woman in a Chemise (bare breast)
  "Q104423960", // Derain (bathers, semi-nude)
  "Q2324643", // Klimt, Judith I (bare breasts)
  "Q3818263", // Mondrian (image did not load in a browser)
  "Q18710645", // Mondrian, Evolution (nude figures)
  "Q18889374", // Munch, Ashes (to be safe)
  "Q84628758", // Klimt, Water Serpents II (nudes)
  "Q5967091", // Klimt, The Virgin (partial nudity)
  "Q1683743", // Munch, Vampire (to be safe)
  "Q60356845", // Léger (photo of a gallery wall)
  "Q115618657", // Matisse (open robe, to be safe)
  "Q19883545", // Matisse, The Dance (nude dancers)
  "Q130549265", // Popova (image did not load in a browser)
  "Q117217879", // Matisse (reclining nude)
  "Q64506260", // Morgan Russell (photo of a gallery wall)
  "Q890678", // Gauguin, Where Do We Come From? (nudes)
  "Q29222763", // Signac, In the Time of Harmony (nude bathers)
  "Q16939042", // Munch (open robe)
  "Q11790258", // Gauguin (possibly topless, to be safe)
  "Q125996422", // Derain, La danse (semi-nude)
  "Q22570122", // Modersohn-Becker, self-portrait (topless)
  "Q18685517", // Marc (nude figure)
  "Q7755915", // Matisse, The Painter and His Model (nude model)
  "Q21748895", // Derain (photo in a gallery, phone in frame)
  "Q55663043", // Macke (reclining figure, to be safe)
  "Q18927476", // Delaunay, The City of Paris (nude Three Graces)
  "Q123529116", // Popova, The model (to be safe)
]);
/** Images that didn't load in a real browser. */
const UNRELIABLE = new Set([]);

async function sparql(query) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const { stdout } = await run(
        "curl",
        ["-sS", "-m", "120", "-A", UA, "-H", "Accept: application/sparql-results+json", "--data-urlencode", `query=${query}`, "https://query.wikidata.org/sparql"],
        { maxBuffer: 64 * 1024 * 1024 },
      );
      return JSON.parse(stdout).results.bindings;
    } catch {
      await new Promise((r) => setTimeout(r, 10000 * (attempt + 1)));
    }
  }
  return null;
}

const id = (uri) => uri.split("/").at(-1);

/** Answers are kept between runs (set CACHE to a folder) so a flaky endpoint doesn't mean starting over. */
const CACHE = process.env.CACHE;

function query(qid) {
  return sparql(`
SELECT ?p (SAMPLE(?img) AS ?image) (MIN(YEAR(?inc)) AS ?year) (SAMPLE(?sl) AS ?links)
  (SAMPLE(?en) AS ?title) (SAMPLE(?any) AS ?other)
  (GROUP_CONCAT(DISTINCT ?tag; separator="|") AS ?tags)
  (GROUP_CONCAT(DISTINCT STR(?col); separator="|") AS ?cols)
  (SAMPLE(?colName) AS ?collection)
WHERE {
  ?p wdt:P170 wd:${qid}; wdt:P31 wd:Q3305213; wdt:P18 ?img; wdt:P571 ?inc; wikibase:sitelinks ?sl .
  FILTER NOT EXISTS { ?p wdt:P170 ?other2 . FILTER(?other2 != wd:${qid}) }
  OPTIONAL { ?p rdfs:label ?en FILTER(LANG(?en) = "en") }
  OPTIONAL { ?p rdfs:label ?any FILTER(LANG(?any) IN ("fr", "de", "nl", "ru", "it", "es", "sv", "nb", "fi", "da")) }
  OPTIONAL { { ?p wdt:P136 ?t } UNION { ?p wdt:P180 ?t } ?t rdfs:label ?tag FILTER(LANG(?tag) = "en") }
  OPTIONAL { ?p wdt:P195 ?col . ?col rdfs:label ?colName FILTER(LANG(?colName) = "en") }
}
GROUP BY ?p
HAVING (MIN(YEAR(?inc)) <= 1930)`);
}

async function paintings(qid) {
  const cached = CACHE && existsSync(`${CACHE}/${qid}.json`) ? JSON.parse(readFileSync(`${CACHE}/${qid}.json`, "utf8")) : null;
  const rows = cached ?? (await query(qid));
  if (CACHE && rows && !cached) writeFileSync(`${CACHE}/${qid}.json`, JSON.stringify(rows));
  if (!rows) throw new Error(`Wikidata didn't answer for ${qid}. Run again; set CACHE to keep answers between runs.`);
  return rows.map((r) => ({
    qid: id(r.p.value),
    image: r.image.value,
    year: Number(r.year.value),
    links: Number(r.links.value),
    title: r.title?.value ?? r.other?.value ?? "",
    tags: r.tags?.value ?? "",
    cols: (r.cols?.value ?? "").split("|").map(id),
    collection: r.collection?.value ?? "",
  }));
}

/** Wikimedia's own image URLs: a resized copy, else the original if it's smaller than that. */
function uploadUrls(f) {
  const h = createHash("md5").update(f).digest("hex");
  const name = encodeURIComponent(f);
  const base = `https://upload.wikimedia.org/wikipedia/commons`;
  const thumb = `${base}/thumb/${h[0]}/${h.slice(0, 2)}/${name}/${WIDTH}px-${name}${/\.tiff?$/i.test(f) ? ".jpg" : ""}`;
  return /\.tiff?$/i.test(f) ? [thumb] : [thumb, `${base}/${h[0]}/${h.slice(0, 2)}/${name}`];
}

function file(image) {
  return decodeURIComponent(image.split("/Special:FilePath/").at(-1)).replace(/ /g, "_");
}

/** Keeps only works whose image actually loads (an image comes back, HTTP 200). */
/** Wikimedia answers 429 when asked too fast, so wait and ask again. Answers are cached with CACHE. */
const loadCache = CACHE && existsSync(`${CACHE}/images.json`) ? JSON.parse(readFileSync(`${CACHE}/images.json`, "utf8")) : {};
async function imageLoads(url) {
  if (loadCache[url]) return loadCache[url];
  for (let attempt = 0; attempt < 6; attempt++) {
    let code = "000";
    let type = "";
    try {
      const { stdout } = await run("curl", ["-sS", "-L", "-m", "40", "-o", "/dev/null", "-r", "0-1023", "-A", UA, "-w", "%{http_code} %{content_type}", url]);
      [code, type = ""] = stdout.trim().split(" ");
    } catch {}
    if (code === "429") {
      await new Promise((r) => setTimeout(r, 5000 * 2 ** attempt));
      continue;
    }
    const answer = { reached: code !== "000", ok: (code === "200" || code === "206") && type.startsWith("image/") };
    if (answer.reached) loadCache[url] = answer;
    if (CACHE) writeFileSync(`${CACHE}/images.json`, JSON.stringify(loadCache));
    await new Promise((r) => setTimeout(r, 400));
    return answer;
  }
  return { reached: true, ok: false };
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

const all = [];
const seenImages = new Set();
for (const [qid, [name, cap]] of Object.entries(ARTISTS)) {
  if (NEVER.test(name)) continue;
  const found = await paintings(qid);
  const kept = found
    .filter((w) => w.title && !/^Q\d+$/.test(w.title))
    .filter((w) => !w.cols.includes(MET))
    .filter((w) => !EXCLUDE.has(w.qid) && !UNRELIABLE.has(w.qid))
    .filter((w) => !NUDE.test(`${w.title} ${w.tags}`) && !CRUCIFIXION.test(`${w.title} ${w.tags}`))
    .filter((w) => /\.(jpe?g|png|tiff?)$/i.test(file(w.image)))
    .sort((a, b) => b.links - a.links || a.qid.localeCompare(b.qid))
    .filter((w) => !seenImages.has(w.image) && seenImages.add(w.image))
    .slice(0, cap);
  console.log(`Wikidata ${String(kept.length).padStart(3)} of ${String(found.length).padStart(4)}  ${name}`);
  for (const w of kept) {
    const f = file(w.image);
    all.push({
      key: `wd:${w.qid}`,
      title: w.title,
      artist: name,
      date: String(w.year),
      medium: "",
      images: uploadUrls(f),
      alt: "",
      museum: w.collection ? `${w.collection}, via Wikimedia Commons` : "Wikimedia Commons",
      url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f)}`,
    });
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const checks = await pool(all, 2, async (w) => {
  let reached = false;
  for (const url of w.images) {
    const c = await imageLoads(url);
    reached ||= c.reached;
    if (c.ok) return { reached, ok: true, url };
  }
  return { reached, ok: false };
});
if (!checks.some((c) => c.reached)) {
  console.error("\nCouldn't reach Wikimedia Commons, so no image was checked. Nothing written.");
  console.error("Allow commons.wikimedia.org and upload.wikimedia.org, then run this again.");
  process.exit(1);
}
const loaded = all.flatMap((w, i) => (checks[i].ok ? [{ ...w, images: undefined, image: checks[i].url }] : []));
console.log(`\nImages checked: ${loaded.length} of ${all.length} load.`);

/** A steady shuffle, so neighbouring numbers jump between artists. */
function shuffle(list, seed = 13) {
  const a = [...list];
  let s = seed;
  const rand = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const metKeys = new Set(JSON.parse(readFileSync(new URL("../src/data/artworks.json", import.meta.url), "utf8")).map((w) => w.title + w.artist));
const ordered = shuffle(loaded.filter((w) => !metKeys.has(w.title + w.artist)).sort((a, b) => a.key.localeCompare(b.key)));
writeFileSync(new URL("../src/data/modern.json", import.meta.url), JSON.stringify(ordered, null, 1) + "\n");
console.log(`\n${ordered.length} paintings written to src/data/modern.json`);
