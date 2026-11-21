/**
 * Check the cleaned datasets for structural problems.
 * Usage: node scripts/validate-dataset.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BBOX } from "./lib/constants.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CATEGORIES = new Set([
  "restaurant",
  "cafe",
  "fast_food",
  "bar",
  "food_court",
  "ice_cream",
  "bakery",
  "sweets",
  "museum",
  "gallery",
  "theatre",
  "cinema",
  "arts_centre",
  "nightclub",
  "park",
  "garden",
  "attraction",
]);

const FAMILIES = new Set(["asian", "american", "italian", "coffee-desserts", "other", "unknown", "not-food"]);
const TIERS = new Set(["under-15", "15-25", "25-40", "40-plus"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateDatasets({ places, stations, campuses, meta }) {
  assert(places.length >= 40, `Expected at least 40 places, found ${places.length}.`);
  assert(stations.length >= 40, `Expected at least 40 stations, found ${stations.length}.`);
  assert(campuses.length === 5, "Expected five starting campuses.");

  const placeIds = new Set();
  for (const place of places) {
    assert(!placeIds.has(place.id), `Duplicate place id ${place.id}`);
    placeIds.add(place.id);
    assert(typeof place.name === "string" && place.name.trim().length > 1, `Bad name on ${place.id}`);
    assert(Number.isFinite(place.lat) && Number.isFinite(place.lon), `Bad coordinates on ${place.id}`);
    assert(
      place.lat >= BBOX.south && place.lat <= BBOX.north && place.lon >= BBOX.west && place.lon <= BBOX.east,
      `Place outside bbox: ${place.name}`,
    );
    assert(CATEGORIES.has(place.category), `Unknown category ${place.category} on ${place.name}`);
    assert(FAMILIES.has(place.cuisineFamily), `Unknown cuisine family on ${place.name}`);
    assert(place.source === "OpenStreetMap", `Unexpected source on ${place.name}`);
    assert(typeof place.sourceId === "string" && place.sourceId.includes("/"), `Bad source id on ${place.name}`);
    assert(place.budget && typeof place.budget.evidence === "string", `Missing budget evidence on ${place.name}`);
    if (place.budget.status === "free" || place.budget.status === "listed") {
      assert(TIERS.has(place.budget.tier), `Priced place ${place.name} has no tier`);
    } else {
      assert(place.budget.status === "unknown", `Bad budget status on ${place.name}`);
      assert(place.budget.tier === null, `Unknown budget should not invent a tier: ${place.name}`);
    }
    if (place.website) assert(/^https?:\/\//i.test(place.website), `Bad website on ${place.name}`);
    if (place.wikipedia) assert(/^https?:\/\/([a-z]{2}\.)?wikipedia\.org\//i.test(place.wikipedia), `Bad Wikipedia URL on ${place.name}`);
  }

  const stationIds = new Set();
  const groups = new Set();
  for (const station of stations) {
    assert(!stationIds.has(station.id), `Duplicate station ${station.id}`);
    stationIds.add(station.id);
    assert(station.name && Number.isFinite(station.lat) && Number.isFinite(station.lon), `Bad station ${station.id}`);
    assert(["accessible", "inaccessible", "unknown"].includes(station.wheelchair), `Bad wheelchair value at ${station.name}`);
    assert(station.provider === "MassDOT", `Station ${station.name} is missing the MassDOT provider.`);
    assert(station.lines.length > 0, `Station ${station.name} has no lines`);
    for (const line of station.lines) {
      groups.add(line.group);
      assert(line.color && line.label, `Incomplete line at ${station.name}`);
    }
  }

  for (const group of ["Red", "Orange", "Blue", "Green"]) {
    assert(groups.has(group), `Missing ${group} Line stations`);
  }

  for (const campus of campuses) {
    assert(stationIds.has(campus.stationId), `${campus.label} points at missing station ${campus.stationId}`);
  }

  assert(meta.placeCount === places.length, "meta.placeCount does not match places.");
  assert(meta.stationCount === stations.length, "meta.stationCount does not match stations.");
  console.log(`Validated ${places.length} places and ${stations.length} stations.`);
}

async function readJson(name) {
  return JSON.parse(await readFile(path.join(root, "src", "data", name), "utf8"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [places, stations, campuses, meta] = await Promise.all([
    readJson("places.json"),
    readJson("stations.json"),
    readJson("campuses.json"),
    readJson("meta.json"),
  ]);
  validateDatasets({ places, stations, campuses, meta });
}
