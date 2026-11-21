import { BBOX } from "./constants.mjs";
import { haversineMeters } from "./geo.mjs";
import {
  addressFromTags,
  budgetFromTags,
  categorize,
  classifyCuisine,
  isDisused,
  isGenericName,
  isNoisyAttraction,
  isPrivate,
  normalizeName,
  openingHoursFromTags,
  websiteFromTags,
  wikipediaUrl,
} from "./normalize.mjs";

const DEDUPE_METERS = 75;

function coordinates(element) {
  if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    return [element.lat, element.lon];
  }
  if (element.center && Number.isFinite(element.center.lat) && Number.isFinite(element.center.lon)) {
    return [element.center.lat, element.center.lon];
  }
  return null;
}

function inBbox(lat, lon) {
  return lat >= BBOX.south && lat <= BBOX.north && lon >= BBOX.west && lon <= BBOX.east;
}

function completeness(place) {
  let score = 0;
  if (place.cuisineRaw) score += 4;
  if (place.address) score += 3;
  if (place.website) score += 2;
  if (place.openingHours) score += 1;
  if (place.wikipedia) score += 2;
  if (place.budget.status !== "unknown") score += 2;
  if (place.osmType === "node" && place.category !== "park" && place.category !== "garden") score += 1;
  return score;
}

function emptyExclusions() {
  return {
    missingName: 0,
    genericName: 0,
    invalidName: 0,
    missingCoords: 0,
    outOfBounds: 0,
    uncategorized: 0,
    noisyAttraction: 0,
    disused: 0,
    privateAccess: 0,
    duplicate: 0,
  };
}

/**
 * @param {Array<Record<string, unknown>>} elements
 */
export function cleanPlaces(elements) {
  const exclusions = emptyExclusions();
  const byId = new Map();

  for (const element of elements) {
    const tags = element.tags && typeof element.tags === "object" ? element.tags : null;
    if (!tags) {
      exclusions.missingName += 1;
      continue;
    }

    const name = typeof tags.name === "string" ? tags.name.trim().replace(/\s+/g, " ") : "";
    if (!name) {
      exclusions.missingName += 1;
      continue;
    }
    if (name.length < 2 || name.length > 140) {
      exclusions.invalidName += 1;
      continue;
    }
    if (isGenericName(name)) {
      exclusions.genericName += 1;
      continue;
    }
    if (isDisused(tags)) {
      exclusions.disused += 1;
      continue;
    }
    if (isPrivate(tags)) {
      exclusions.privateAccess += 1;
      continue;
    }

    const coords = coordinates(element);
    if (!coords) {
      exclusions.missingCoords += 1;
      continue;
    }
    const [lat, lon] = coords;
    if (!inBbox(lat, lon)) {
      exclusions.outOfBounds += 1;
      continue;
    }

    const categoryPair = categorize(tags);
    if (!categoryPair) {
      exclusions.uncategorized += 1;
      continue;
    }
    const [category, categoryLabel] = categoryPair;
    if (isNoisyAttraction(tags, category)) {
      exclusions.noisyAttraction += 1;
      continue;
    }

    const cuisine = classifyCuisine(tags, category);
    const located = addressFromTags(tags);
    const hours = openingHoursFromTags(tags);
    const wikidata = typeof tags.wikidata === "string" && /^Q\d+$/.test(tags.wikidata) ? tags.wikidata : null;
    const id = `osm-${element.type}-${element.id}`;

    const place = {
      id,
      name,
      category,
      categoryLabel,
      ...cuisine,
      lat,
      lon,
      address: located.address,
      city: located.city,
      website: websiteFromTags(tags),
      ...hours,
      wikipedia: wikipediaUrl(tags.wikipedia),
      wikidata,
      budget: budgetFromTags(tags),
      source: "OpenStreetMap",
      sourceId: `${element.type}/${element.id}`,
      osmType: element.type,
      osmId: element.id,
    };

    byId.set(id, place);
  }

  const groups = new Map();
  for (const place of byId.values()) {
    const key = normalizeName(place.name);
    const list = groups.get(key);
    if (list) list.push(place);
    else groups.set(key, [place]);
  }

  const places = [];
  for (const group of groups.values()) {
    group.sort((a, b) => completeness(b) - completeness(a) || a.id.localeCompare(b.id));
    const chosen = [];
    for (const place of group) {
      const duplicate = chosen.some(
        (other) => haversineMeters(place.lat, place.lon, other.lat, other.lon) <= DEDUPE_METERS,
      );
      if (duplicate) {
        exclusions.duplicate += 1;
        continue;
      }
      chosen.push(place);
    }
    places.push(...chosen);
  }

  places.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  return { places, exclusions };
}
