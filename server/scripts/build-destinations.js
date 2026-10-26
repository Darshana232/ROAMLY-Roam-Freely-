// Builds src/seed/data/destinations.json from destinations.spec.js by pulling
// verifiable facts from Wikipedia and Wikimedia Commons:
//   - coordinates and a short summary (with a link to the article)
//   - the article's lead photo, its author and licence
// Run once when the spec changes: `node scripts/build-destinations.js`.
// The output is committed so seeding never depends on the network.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { destinations } from './destinations.spec.js';

const UA = 'RoamlyDataBuild/0.1 (student project; contact via GitHub)';
const OUT = new URL('../src/seed/data/destinations.json', import.meta.url);

// Responses are cached on disk so re-running after a spec tweak only fetches
// what changed, and requests are paced to respect Wikimedia's rate limits.
const CACHE = new URL('./.cache/', import.meta.url);
await mkdir(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) {
  const key = new URL(createHash('sha1').update(url).digest('hex') + '.json', CACHE);
  try {
    return JSON.parse(await readFile(key, 'utf8'));
  } catch {
    // not cached yet
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(700);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok || res.status === 404) {
      const data = res.ok ? await res.json() : null;
      await writeFile(key, JSON.stringify(data));
      return data;
    }
    const wait = Number(res.headers.get('retry-after')) || 5 * (attempt + 1);
    console.log(`  ${res.status}, waiting ${wait}s`);
    await sleep(wait * 1000);
  }
  throw new Error(`Failed: ${url}`);
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const stripHtml = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// First two sentences keep descriptions short without rewriting the source.
function firstSentences(text, n = 2) {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  return parts.slice(0, n).join('').trim();
}

async function summary(title) {
  const data = await getJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!data || data.type === 'disambiguation') return null;
  return {
    title: data.title,
    url: data.content_urls?.desktop?.page,
    extract: data.extract,
    coords: data.coordinates ? { lat: data.coordinates.lat, lng: data.coordinates.lon } : null,
  };
}

async function leadImage(title, width, fileOverride) {
  let name = fileOverride;
  if (!name) {
    const q = await getJSON(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&redirects=1&titles=${encodeURIComponent(title)}`,
    );
    name = Object.values(q?.query?.pages ?? {})[0]?.pageimage;
  }
  if (!name) return null;

  const file = `File:${name}`;
  const info = await getJSON(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=${width}&titles=${encodeURIComponent(file)}`,
  );
  const ii = Object.values(info?.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!ii) return null; // non-free images hosted only on en.wikipedia are skipped
  const meta = ii.extmetadata ?? {};
  return {
    src: ii.thumburl ?? ii.url,
    width: ii.thumbwidth ?? ii.width,
    height: ii.thumbheight ?? ii.height,
    author: stripHtml(meta.Artist?.value) || 'Unknown',
    license: meta.LicenseShortName?.value ?? 'See source',
    sourceUrl: ii.descriptionurl,
  };
}

const problems = [];
const out = [];

for (const d of destinations) {
  const s = await summary(d.wiki);
  if (!s?.coords) problems.push(`destination ${d.name}: ${s ? 'no coordinates' : 'not found'}`);
  const image = await leadImage(d.imageFrom ?? d.wiki, 1600, d.imageFile);
  if (!image) problems.push(`destination ${d.name}: no free image`);

  const attractions = [];
  for (const a of d.attractions) {
    const as = await summary(a.wiki);
    if (!as) {
      problems.push(`attraction ${a.wiki} (${d.name}): not found, skipped`);
      continue;
    }
    attractions.push({
      slug: slugify(a.name ?? as.title),
      name: a.name ?? as.title,
      minutes: a.minutes,
      best: a.best ?? 'any',
      hours: a.hours ?? null,
      // Attractions without their own coordinates inherit the destination's,
      // flagged so the itinerary planner knows the position is approximate.
      coords: (!a.parent && as.coords) || s?.coords || as.coords || null,
      coordsApprox: Boolean(a.parent || !as.coords),
      // A parent article describes the whole town, so its text would be wrong here.
      summary: a.parent ? '' : firstSentences(as.extract, 1),
      source: as.url,
    });
  }

  out.push({
    slug: slugify(d.name),
    name: d.name,
    region: d.region,
    coords: s?.coords ?? null,
    roadKm: d.roadKm,
    crowd: d.crowd,
    costTier: d.costTier,
    busFromBlr: d.busFromBlr,
    remote: d.remote,
    idealDays: d.idealDays,
    interests: d.interests,
    summary: s ? firstSentences(s.extract, 2) : '',
    source: s?.url ?? null,
    image,
    attractions,
  });
  console.log(`✓ ${d.name} (${attractions.length}/${d.attractions.length} attractions)`);
}

await writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`\nWrote ${out.length} destinations to ${OUT.pathname}`);
if (problems.length) console.log(`\nNeeds attention:\n  ${problems.join('\n  ')}`);
