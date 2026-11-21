/**
 * Download MBTA subway and light-rail stations from the public V3 API.
 * A key is not required for this low-volume build. If MBTA_API_KEY is set, it is sent as a header.
 *
 * Usage: node scripts/fetch-mbta.mjs
 * Writes data/raw/mbta.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MBTA_API } from "./lib/constants.mjs";
import { fetchJson, sleep } from "./lib/http.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "data", "raw");

function headers() {
  const base = { Accept: "application/vnd.api+json" };
  if (process.env.MBTA_API_KEY) base["x-api-key"] = process.env.MBTA_API_KEY;
  return base;
}

async function fetchAllPages(startUrl) {
  const items = [];
  let url = startUrl;
  const seen = new Set();
  while (url) {
    if (seen.has(url)) break;
    seen.add(url);
    const json = await fetchJson(url, { headers: headers() }, { timeoutMs: 45000, retries: 3 });
    items.push(...(json.data ?? []));
    const next = json.links?.next ?? null;
    if (!next) break;
    url = next.startsWith("http") ? next : `${MBTA_API}${next}`;
  }
  return items;
}

async function fetchStops(routeId) {
  const withLimit = `${MBTA_API}/stops?filter[route]=${encodeURIComponent(routeId)}&page[limit]=100`;
  try {
    return await fetchAllPages(withLimit);
  } catch (error) {
    console.warn(`Paged stop request failed for ${routeId} (${error instanceof Error ? error.message : error}). Retrying without a page size.`);
    return fetchAllPages(`${MBTA_API}/stops?filter[route]=${encodeURIComponent(routeId)}`);
  }
}

export function selectRapidRoutes(routes) {
  const ids = routes.map((route) => route.id);
  const hasGreenBranch = ids.some((id) => id.startsWith("Green-"));
  return routes.filter((route) => {
    const type = route.attributes?.type;
    if (type !== 0 && type !== 1) return false;
    if (route.id === "Green" && hasGreenBranch) return false;
    return /^(Red|Orange|Blue|Green|Mattapan)/.test(route.id);
  });
}

export async function fetchMbtaRaw() {
  const retrievedAt = new Date().toISOString();
  const routesDoc = await fetchJson(`${MBTA_API}/routes?filter[type]=0,1`, { headers: headers() }, { timeoutMs: 45000 });
  const selected = selectRapidRoutes(routesDoc.data ?? []);
  if (selected.length === 0) {
    throw new Error("MBTA routes response did not include Red, Orange, Blue, Green, or Mattapan routes.");
  }
  console.log(`MBTA routes: ${selected.map((route) => route.id).join(", ")}`);

  const stopsByRoute = {};
  for (const route of selected) {
    await sleep(250);
    const stops = await fetchStops(route.id);
    stopsByRoute[route.id] = stops;
    console.log(`  ${route.id}: ${stops.length} stop records`);
  }

  const known = new Set(Object.values(stopsByRoute).flat().map((stop) => stop.id));
  const missingParents = new Set();
  for (const stop of Object.values(stopsByRoute).flat()) {
    const parentId = stop.relationships?.parent_station?.data?.id;
    if (parentId && !known.has(parentId)) missingParents.add(parentId);
  }

  const parents = [];
  const missing = [...missingParents];
  for (let index = 0; index < missing.length; index += 40) {
    const chunk = missing.slice(index, index + 40);
    await sleep(250);
    const doc = await fetchJson(
      `${MBTA_API}/stops?filter[id]=${encodeURIComponent(chunk.join(","))}`,
      { headers: headers() },
      { timeoutMs: 45000 },
    );
    parents.push(...(doc.data ?? []));
  }
  if (parents.length > 0) console.log(`Fetched ${parents.length} parent stations that were not in the route payloads.`);

  return {
    retrievedAt,
    api: MBTA_API,
    routes: selected,
    stopsByRoute,
    parents,
  };
}

export async function fetchAndSaveMbta() {
  const payload = await fetchMbtaRaw();
  await mkdir(rawDir, { recursive: true });
  await writeFile(path.join(rawDir, "mbta.json"), JSON.stringify(payload));
  const stopCount = Object.values(payload.stopsByRoute).reduce((sum, list) => sum + list.length, 0);
  console.log(`Saved MBTA payload (${stopCount} stop rows before station rollup).`);
  return payload;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  fetchAndSaveMbta().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
