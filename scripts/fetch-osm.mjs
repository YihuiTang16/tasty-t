/**
 * Download Boston/Cambridge points of interest from the Overpass API.
 *
 * Usage: node scripts/fetch-osm.mjs
 * Writes data/raw/osm.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BBOX, OVERPASS_ENDPOINTS } from "./lib/constants.mjs";
import { fetchText, sleep } from "./lib/http.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "data", "raw");

const bbox = `(${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east})`;

function clause(filter) {
  return `nwr${filter}["name"]${bbox};`;
}

export function overpassQuery() {
  return `[out:json][timeout:90];
(
  ${clause('["amenity"~"^(restaurant|cafe|fast_food|bar|ice_cream|food_court|theatre|cinema|arts_centre|nightclub)$"]')}
  ${clause('["shop"~"^(bakery|pastry|confectionery|ice_cream)$"]')}
  ${clause('["tourism"~"^(museum|gallery|attraction)$"]')}
  ${clause('["leisure"~"^(park|garden)$"]')}
);
out center tags;`;
}

export function splitQueries() {
  return [
    clause('["amenity"~"^(restaurant|cafe|fast_food|bar|ice_cream|food_court)$"]'),
    clause('["shop"~"^(bakery|pastry|confectionery|ice_cream)$"]'),
    clause('["amenity"~"^(theatre|cinema|arts_centre|nightclub)$"]'),
    clause('["tourism"~"^(museum|gallery|attraction)$"]'),
    clause('["leisure"~"^(park|garden)$"]'),
  ].map(
    (body) => `[out:json][timeout:60];
(
  ${body}
);
out center tags;`,
  );
}

async function runQuery(query) {
  let lastError = new Error("No Overpass endpoint succeeded.");
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Overpass request to ${endpoint}`);
      const text = await fetchText(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "*/*",
          },
          body: new URLSearchParams({ data: query }),
        },
        { timeoutMs: 120000, retries: 1 },
      );
      const json = JSON.parse(text);
      if (!Array.isArray(json.elements)) {
        throw new Error(`Overpass response from ${endpoint} did not include elements.`);
      }
      return { endpoint, elements: json.elements };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Overpass endpoint failed: ${lastError.message}`);
      await sleep(3000);
    }
  }
  throw lastError;
}

export async function fetchOsmElements() {
  try {
    const result = await runQuery(overpassQuery());
    return { ...result, mode: "combined" };
  } catch (error) {
    console.warn(`Combined Overpass query failed (${error instanceof Error ? error.message : error}). Splitting the query.`);
  }

  const elements = [];
  const seen = new Set();
  let endpointUsed = null;
  for (const query of splitQueries()) {
    const result = await runQuery(query);
    endpointUsed = result.endpoint;
    for (const element of result.elements) {
      const key = `${element.type}/${element.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      elements.push(element);
    }
    await sleep(5000);
  }
  return { endpoint: endpointUsed, elements, mode: "split" };
}

export async function fetchAndSaveOsm() {
  const retrievedAt = new Date().toISOString();
  const result = await fetchOsmElements();
  await mkdir(rawDir, { recursive: true });
  const payload = {
    retrievedAt,
    endpoint: result.endpoint,
    mode: result.mode,
    query: overpassQuery(),
    elementCount: result.elements.length,
    elements: result.elements,
  };
  await writeFile(path.join(rawDir, "osm.json"), JSON.stringify(payload));
  console.log(`Saved ${result.elements.length} OpenStreetMap elements from ${result.endpoint} (${result.mode}).`);
  return payload;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  fetchAndSaveOsm().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
