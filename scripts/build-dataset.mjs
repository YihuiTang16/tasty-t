/**
 * Build the local datasets used by the app.
 *
 * Usage:
 *   node scripts/build-dataset.mjs            # reuse data/raw when present, fetch when missing
 *   node scripts/build-dataset.mjs --refresh  # download OpenStreetMap and MBTA again
 *   node scripts/build-dataset.mjs --offline  # fail if raw files are missing
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BBOX, CLEANING_RULES } from "./lib/constants.mjs";
import { haversineMiles } from "./lib/geo.mjs";
import { cleanPlaces } from "./lib/places.mjs";
import { buildCampuses, cleanStations } from "./lib/stations.mjs";
import { fetchAndSaveMbta } from "./fetch-mbta.mjs";
import { fetchAndSaveOsm } from "./fetch-osm.mjs";
import { validateDatasets } from "./validate-dataset.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "data", "raw");
const outDir = path.join(root, "src", "data");

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function loadRaw(name, refresh, offline, fetcher) {
  const file = path.join(rawDir, name);
  if (!refresh) {
    try {
      return await readJson(file);
    } catch (error) {
      if (offline) throw new Error(`${file} is missing and --offline was set.`);
      if (error && error.code !== "ENOENT") throw error;
    }
  } else if (offline) {
    throw new Error("--refresh and --offline cannot be used together.");
  }
  return fetcher();
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

async function main() {
  const refresh = process.argv.includes("--refresh");
  const offline = process.argv.includes("--offline");
  const osm = await loadRaw("osm.json", refresh, offline, fetchAndSaveOsm);
  const mbta = await loadRaw("mbta.json", refresh, offline, fetchAndSaveMbta);

  const { places, exclusions } = cleanPlaces(osm.elements ?? []);
  const stations = cleanStations(mbta);
  const campuses = buildCampuses(stations);

  for (const campus of campuses) {
    const station = stations.find((item) => item.id === campus.stationId);
    const nearby = places.filter((place) => haversineMiles(place.lat, place.lon, station.lat, station.lon) <= 2).length;
    if (nearby === 0) {
      throw new Error(`${campus.label} has no cleaned places within 2 miles of ${station.name}. The bounding box or filters are wrong.`);
    }
  }

  const meta = {
    project: "Tasty T",
    retrievedAt: new Date().toISOString(),
    osmRetrievedAt: osm.retrievedAt,
    mbtaRetrievedAt: mbta.retrievedAt,
    osmEndpoint: osm.endpoint,
    osmMode: osm.mode,
    mbtaApi: mbta.api,
    bbox: BBOX,
    placeCount: places.length,
    stationCount: stations.length,
    exclusions,
    categories: countBy(places, (place) => place.category),
    cuisineFamilies: countBy(places, (place) => place.cuisineFamily),
    budget: countBy(places, (place) => place.budget.status),
    lines: countBy(
      stations.flatMap((station) => station.lines.map((line) => line.group)),
      (group) => group,
    ),
    campuses: campuses.map((campus) => ({
      id: campus.id,
      stationId: campus.stationId,
      stationName: campus.stationName,
    })),
    licenses: {
      places: {
        provider: "OpenStreetMap contributors",
        license: "Open Database License (ODbL) 1.0",
        url: "https://www.openstreetmap.org/copyright",
        attribution: "© OpenStreetMap contributors",
      },
      stations: {
        provider: "MassDOT",
        agreement: "MassDOT Developers License Agreement",
        url: "https://cdn.mbta.com/sites/default/files/2023-08/mbta-massdot-develop-license-agreement.pdf",
        attribution: "Station data provided by MassDOT",
      },
    },
    cleaningRules: CLEANING_RULES,
    notIncluded: [
      "Restaurant menu prices are not in OpenStreetMap. This build does not estimate them.",
      "Straight-line distances are computed in the app. Travel times and transfer directions are not.",
      "Silver Line and local bus stops are not part of this station set.",
      "The app is not affiliated with the MBTA or MassDOT and does not use their logos.",
    ],
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "places.json"), `${JSON.stringify(places, null, 2)}\n`);
  await writeFile(path.join(outDir, "stations.json"), `${JSON.stringify(stations, null, 2)}\n`);
  await writeFile(path.join(outDir, "campuses.json"), `${JSON.stringify(campuses, null, 2)}\n`);
  await writeFile(path.join(outDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

  console.log(JSON.stringify({
    placeCount: meta.placeCount,
    stationCount: meta.stationCount,
    categories: meta.categories,
    cuisineFamilies: meta.cuisineFamilies,
    budget: meta.budget,
    lines: meta.lines,
    exclusions: meta.exclusions,
    campuses: meta.campuses,
  }, null, 2));

  validateDatasets({ places, stations, campuses, meta });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
