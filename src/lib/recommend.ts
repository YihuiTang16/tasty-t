import { formatMiles, formatStationLines, normalizeName, transitDirectionsUrl } from "./format.ts";
import { haversineMiles } from "./geo.ts";
import { optionLabel, CUISINE_OPTIONS } from "./options.ts";
import type {
  BudgetTier,
  Campus,
  Category,
  ExperienceChoice,
  Place,
  Recommendation,
  ScoreWeights,
  Station,
  TimeChoice,
  TripPreferences,
} from "../types.ts";

export const BASE_WEIGHTS: ScoreWeights = {
  cuisine: 0.35,
  transit: 0.3,
  budget: 0.2,
  experience: 0.15,
};

const STEP_FREE_DETOUR_MILES = 0.35;

const EXPERIENCE_SCORES: Record<ExperienceChoice, Record<Category, number>> = {
  "quick-bite": {
    restaurant: 0.62,
    cafe: 0.95,
    fast_food: 1,
    bar: 0.22,
    food_court: 0.96,
    ice_cream: 0.74,
    bakery: 0.9,
    sweets: 0.7,
    museum: 0.12,
    gallery: 0.12,
    theatre: 0.15,
    cinema: 0.18,
    arts_centre: 0.12,
    nightclub: 0.08,
    park: 0.1,
    garden: 0.12,
    attraction: 0.14,
  },
  "study-cafe": {
    restaurant: 0.28,
    cafe: 1,
    fast_food: 0.2,
    bar: 0.08,
    food_court: 0.24,
    ice_cream: 0.32,
    bakery: 0.78,
    sweets: 0.55,
    museum: 0.22,
    gallery: 0.3,
    theatre: 0.1,
    cinema: 0.08,
    arts_centre: 0.2,
    nightclub: 0.05,
    park: 0.42,
    garden: 0.4,
    attraction: 0.16,
  },
  "date-night": {
    restaurant: 1,
    cafe: 0.4,
    fast_food: 0.16,
    bar: 0.74,
    food_court: 0.18,
    ice_cream: 0.48,
    bakery: 0.26,
    sweets: 0.3,
    museum: 0.58,
    gallery: 0.64,
    theatre: 0.82,
    cinema: 0.78,
    arts_centre: 0.6,
    nightclub: 0.7,
    park: 0.36,
    garden: 0.4,
    attraction: 0.46,
  },
  explore: {
    restaurant: 0.52,
    cafe: 0.46,
    fast_food: 0.2,
    bar: 0.3,
    food_court: 0.22,
    ice_cream: 0.34,
    bakery: 0.38,
    sweets: 0.3,
    museum: 1,
    gallery: 0.9,
    theatre: 0.7,
    cinema: 0.45,
    arts_centre: 0.78,
    nightclub: 0.28,
    park: 0.88,
    garden: 0.84,
    attraction: 0.92,
  },
  weekend: {
    restaurant: 0.5,
    cafe: 0.4,
    fast_food: 0.16,
    bar: 0.38,
    food_court: 0.2,
    ice_cream: 0.48,
    bakery: 0.34,
    sweets: 0.32,
    museum: 0.94,
    gallery: 0.8,
    theatre: 0.76,
    cinema: 0.7,
    arts_centre: 0.74,
    nightclub: 0.62,
    park: 1,
    garden: 0.9,
    attraction: 0.9,
  },
};

const BUDGET_RANK: Record<BudgetTier, number> = {
  "under-15": 0,
  "15-25": 1,
  "25-40": 2,
  "40-plus": 3,
};

export function budgetFit(place: Place, preference: BudgetTier): number | null {
  if (place.budget.tier == null) return null;
  if (place.budget.status !== "free" && place.budget.status !== "listed") return null;
  const gap = BUDGET_RANK[place.budget.tier] - BUDGET_RANK[preference];
  if (gap === 0) return 1;
  if (gap < 0) {
    const cheaperBy = -gap;
    if (cheaperBy === 1) return 0.78;
    if (cheaperBy === 2) return 0.6;
    return 0.48;
  }
  if (gap === 1) return 0.35;
  if (gap === 2) return 0.16;
  return 0.08;
}

function cuisineMatch(place: Place, choice: TripPreferences["cuisine"]): { score: number; matched: boolean } {
  if (choice === "any") return { score: 0.8, matched: false };
  if (place.cuisineFamily === choice) return { score: 1, matched: true };
  if (place.cuisineFamily === "unknown") return { score: 0.42, matched: false };
  if (place.cuisineFamily === "not-food") return { score: 0.08, matched: false };
  return { score: 0.12, matched: false };
}

function stationProximity(miles: number): number {
  // A walk under about half a mile stays a strong station match. Longer walks fall off.
  if (miles <= 0.4) return 1 - miles * 0.2;
  if (miles <= 1) return 0.92 - (miles - 0.4) * 0.55;
  if (miles <= 2) return 0.59 - (miles - 1) * 0.28;
  return Math.max(0.08, 0.31 - (miles - 2) * 0.1);
}

function originReach(miles: number, time: TimeChoice): number {
  const scale = time === "1h" ? 0.9 : time === "2h" ? 0.42 : time === "half-day" ? 0.18 : 0.12;
  return 1 / (1 + miles * scale);
}

function experienceScoreFor(place: Place, experience: ExperienceChoice): number {
  const base = EXPERIENCE_SCORES[experience][place.category];
  const pocketPark =
    (experience === "explore" || experience === "weekend") &&
    (place.category === "park" || place.category === "garden") &&
    !place.wikipedia &&
    !place.wikidata;
  // A Wikipedia or Wikidata link is the source's signal that a park is a destination.
  return pocketPark ? base * 0.62 : base;
}

function transitBlend(time: TimeChoice): { station: number; origin: number } {
  if (time === "1h") return { station: 0.35, origin: 0.65 };
  if (time === "2h") return { station: 0.48, origin: 0.52 };
  if (time === "half-day") return { station: 0.6, origin: 0.4 };
  return { station: 0.72, origin: 0.28 };
}

export function pickStation(place: Place, stations: Station[], stepFree: boolean): { station: Station; miles: number } {
  let nearest: { station: Station; miles: number } | null = null;
  let nearestAccessible: { station: Station; miles: number } | null = null;

  for (const station of stations) {
    const miles = haversineMiles(place.lat, place.lon, station.lat, station.lon);
    if (!nearest || miles < nearest.miles) nearest = { station, miles };
    if (station.wheelchair === "accessible" && (!nearestAccessible || miles < nearestAccessible.miles)) {
      nearestAccessible = { station, miles };
    }
  }

  if (!nearest) throw new Error("No MBTA stations are loaded.");
  if (!stepFree || !nearestAccessible) return nearest;
  if (nearestAccessible.miles <= nearest.miles + STEP_FREE_DETOUR_MILES || nearestAccessible.miles <= 0.6) {
    return nearestAccessible;
  }
  return nearest;
}

function usedWeights(budgetKnown: boolean): ScoreWeights {
  if (budgetKnown) return { ...BASE_WEIGHTS };
  const rest = BASE_WEIGHTS.cuisine + BASE_WEIGHTS.transit + BASE_WEIGHTS.experience;
  return {
    cuisine: BASE_WEIGHTS.cuisine / rest,
    transit: BASE_WEIGHTS.transit / rest,
    budget: 0,
    experience: BASE_WEIGHTS.experience / rest,
  };
}

function nounPhrase(label: string): string {
  const lower = label.toLowerCase();
  return `${/^[aeiou]/i.test(lower) ? "an" : "a"} ${lower}`;
}

function experiencePhrase(experience: ExperienceChoice, place: Place): string {
  const listed = `listed as ${nounPhrase(place.categoryLabel)}`;
  if (experience === "quick-bite") return `fits a quick bite because it is ${listed}`;
  if (experience === "study-cafe") return `fits a study stop because it is ${listed}`;
  if (experience === "date-night") return `fits a date night because it is ${listed}`;
  if (experience === "explore") return `fits exploring the city because it is ${listed}`;
  return `fits a weekend outing because it is ${listed}`;
}

function explain(
  place: Place,
  prefs: TripPreferences,
  cuisineMatched: boolean,
  experienceScore: number,
  budgetScore: number | null,
  station: Station,
  stationMiles: number,
): string {
  const bits: string[] = [];
  if (cuisineMatched) {
    const family = optionLabel(CUISINE_OPTIONS, prefs.cuisine as Exclude<TripPreferences["cuisine"], "any">);
    const specific = place.cuisineMatchLabel;
    if (specific && specific.toLowerCase() !== family.toLowerCase()) {
      bits.push(`matches your ${family} preference (${specific})`);
    } else if (place.cuisineLabel || place.cuisineRaw) {
      bits.push(`matches your ${family} preference`);
    } else {
      bits.push(`is ${nounPhrase(place.categoryLabel)}, which fits ${family}`);
    }
  }

  bits.push(`is ${formatMiles(stationMiles)} from ${station.name} (${formatStationLines(station.lines)})`);

  if (experienceScore >= 0.9) bits.push(experiencePhrase(prefs.experience, place));

  if (budgetScore === 1) {
    bits.push(
      place.budget.status === "free"
        ? "is listed as free to enter, which fits your budget"
        : "has a listed charge that fits your budget",
    );
  }

  const text =
    bits.length === 1
      ? bits[0]
      : bits.length === 2
        ? `${bits[0]} and ${bits[1]}`
        : `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`;

  let sentence = `This place ${text}.`;
  if (prefs.stepFree) {
    if (station.wheelchair === "accessible") sentence += ` ${station.name} lists step-free boarding.`;
    else if (station.wheelchair === "inaccessible") sentence += ` ${station.name} is listed as not step-free.`;
    else sentence += ` Step-free status at ${station.name} is not listed.`;
  }
  return sentence;
}

export function selectDiverse<T extends { place: { id: string; name: string } }>(
  sorted: T[],
  limit: number,
  maxPerName = 2,
): T[] {
  const counts = new Map<string, number>();
  const chosen: T[] = [];
  const skipped: T[] = [];

  for (const item of sorted) {
    const key = normalizeName(item.place.name);
    const used = counts.get(key) ?? 0;
    if (used >= maxPerName) {
      skipped.push(item);
      continue;
    }
    counts.set(key, used + 1);
    chosen.push(item);
    if (chosen.length >= limit) return chosen;
  }

  for (const item of skipped) {
    if (chosen.length >= limit) break;
    chosen.push(item);
  }
  return chosen;
}

export function recommend(
  places: Place[],
  stations: Station[],
  campuses: Campus[],
  prefs: TripPreferences,
  limit = 6,
): Recommendation[] {
  const campus = campuses.find((item) => item.id === prefs.campusId);
  if (!campus) throw new Error("Choose a starting point that is still in the dataset.");
  const origin = stations.find((station) => station.id === campus.stationId);
  if (!origin) throw new Error(`The starting station for ${campus.label} is missing from the MBTA dataset.`);
  if (stations.length === 0) throw new Error("No MBTA stations are loaded.");

  const blend = transitBlend(prefs.time);
  const scored: Recommendation[] = places.map((place) => {
    const cuisine = cuisineMatch(place, prefs.cuisine);
    const picked = pickStation(place, stations, prefs.stepFree);
    const originMiles = haversineMiles(place.lat, place.lon, origin.lat, origin.lon);
    let transitScore =
      blend.station * stationProximity(picked.miles) + blend.origin * originReach(originMiles, prefs.time);
    if (prefs.stepFree && picked.station.wheelchair === "inaccessible") transitScore *= 0.45;
    else if (prefs.stepFree && picked.station.wheelchair === "unknown") transitScore *= 0.8;
    transitScore = Math.min(1, Math.max(0, transitScore));

    const budgetScore = budgetFit(place, prefs.budget);
    const experienceScore = experienceScoreFor(place, prefs.experience);
    const weights = usedWeights(budgetScore != null);
    const score =
      cuisine.score * weights.cuisine +
      transitScore * weights.transit +
      (budgetScore ?? 0) * weights.budget +
      experienceScore * weights.experience;

    return {
      place,
      score,
      cuisineScore: cuisine.score,
      transitScore,
      budgetScore,
      experienceScore,
      weights,
      station: picked.station,
      stationMiles: picked.miles,
      originMiles,
      explanation: explain(place, prefs, cuisine.matched, experienceScore, budgetScore, picked.station, picked.miles),
      mapsUrl: transitDirectionsUrl(origin, place),
    };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.originMiles - b.originMiles ||
      a.stationMiles - b.stationMiles ||
      a.place.name.localeCompare(b.place.name) ||
      a.place.id.localeCompare(b.place.id),
  );
  return selectDiverse(scored, limit, 1);
}
