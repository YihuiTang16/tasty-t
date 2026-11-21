import { describe, expect, it } from "vitest";
import { campuses, places, stations } from "../data/index.ts";
import { transitDirectionsUrl } from "./format.ts";
import { SAMPLE_TRIP, STUDY_TRIP, WEEKEND_TRIP } from "./presets.ts";
import { BASE_WEIGHTS, recommend, selectDiverse } from "./recommend.ts";
import type { BudgetInfo, Campus, Category, Place, Station, TripPreferences } from "../types.ts";

function budget(partial: Partial<BudgetInfo> & Pick<BudgetInfo, "status">): BudgetInfo {
  if (partial.status === "unknown") {
    return {
      status: "unknown",
      tier: null,
      label: partial.label ?? "Budget not listed",
      evidence: partial.evidence ?? "No fee or charge tag in OpenStreetMap",
    };
  }
  return {
    status: partial.status,
    tier: partial.tier ?? "under-15",
    label: partial.label ?? "Listed",
    evidence: partial.evidence ?? "test evidence",
  };
}

function place(partial: Partial<Place> & Pick<Place, "id" | "name" | "category">): Place {
  return {
    categoryLabel: partial.category,
    cuisineFamily: "unknown",
    cuisineRaw: null,
    cuisineLabel: null,
    cuisineMatchLabel: null,
    lat: 42.35,
    lon: -71.1,
    address: null,
    city: null,
    website: null,
    openingHours: null,
    openingHoursScope: null,
    wikipedia: null,
    wikidata: null,
    budget: budget({ status: "unknown" }),
    source: "OpenStreetMap",
    sourceId: `node/${partial.id}`,
    osmType: "node",
    osmId: 1,
    ...partial,
  };
}

function station(partial: Partial<Station> & Pick<Station, "id" | "name" | "lat" | "lon">): Station {
  return {
    municipality: "Boston",
    wheelchairBoarding: 0,
    wheelchair: "unknown",
    coordinateFrom: "station",
    lines: [
      {
        id: "Green-B",
        group: "Green",
        branch: "B",
        label: "Green Line",
        color: "#00843D",
        textColor: "#FFFFFF",
        colorSource: "mbta",
        vehicle: "light-rail",
      },
    ],
    source: "MBTA V3 API",
    provider: "MassDOT",
    ...partial,
  };
}

const origin = station({ id: "origin", name: "Origin Station", lat: 42.35, lon: -71.1, wheelchair: "accessible", wheelchairBoarding: 1 });
const campus: Campus = { id: "test", label: "Test Campus", shortLabel: "Test", stationId: origin.id, stationName: origin.name };

function prefs(partial: Partial<TripPreferences> = {}): TripPreferences {
  return {
    campusId: "test",
    budget: "under-15",
    cuisine: "any",
    experience: "date-night",
    time: "flexible",
    stepFree: false,
    ...partial,
  };
}

describe("recommendation scoring", () => {
  it("ranks a matching cuisine above a different cuisine", () => {
    const asian = place({
      id: "asian",
      name: "Asian Kitchen",
      category: "restaurant",
      cuisineFamily: "asian",
      cuisineLabel: "Korean",
      cuisineMatchLabel: "Korean",
      cuisineRaw: "korean",
    });
    const american = place({
      id: "american",
      name: "American Grill",
      category: "restaurant",
      cuisineFamily: "american",
      cuisineLabel: "Burger",
      cuisineMatchLabel: "Burger",
      cuisineRaw: "burger",
    });
    const [first] = recommend([american, asian], [origin], [campus], prefs({ cuisine: "asian" }));
    expect(first?.place.id).toBe("asian");
    expect(first?.explanation).toContain("Asian");
    expect(first?.explanation).toContain("Korean");
    expect(first?.explanation).not.toMatch(/\$\d/);
  });

  it("lets a confirmed budget change the order without inventing a price", () => {
    const shared = { category: "museum" as Category, lat: 42.35, lon: -71.1, cuisineFamily: "not-food" as const };
    const freePlace = place({
      id: "free",
      name: "Free Museum",
      ...shared,
      budget: budget({ status: "free", tier: "under-15", label: "Free to enter", evidence: "OpenStreetMap fee=no" }),
    });
    const costly = place({
      id: "costly",
      name: "Costly Museum",
      ...shared,
      budget: budget({ status: "listed", tier: "40-plus", label: "Listed charge: 50 USD", evidence: "OpenStreetMap charge=50 USD" }),
    });
    const low = recommend([costly, freePlace], [origin], [campus], prefs({ budget: "under-15", experience: "explore" }));
    const high = recommend([freePlace, costly], [origin], [campus], prefs({ budget: "40-plus", experience: "explore" }));
    expect(low[0]?.place.id).toBe("free");
    expect(high[0]?.place.id).toBe("costly");
    expect(low[0]?.explanation).toContain("free to enter");
    expect(low[1]?.budgetScore).not.toBe(1);
    expect(low[1]?.explanation.toLowerCase()).not.toContain("fits your budget");
  });

  it("drops the budget weight when the price is unknown", () => {
    const unknown = place({ id: "unknown", name: "Unknown Price", category: "restaurant", cuisineFamily: "asian", cuisineMatchLabel: "Thai", cuisineLabel: "Thai", cuisineRaw: "thai" });
    const [result] = recommend([unknown], [origin], [campus], prefs({ cuisine: "asian" }));
    expect(result?.budgetScore).toBeNull();
    expect(result?.weights.budget).toBe(0);
    expect(result?.weights.cuisine).toBeCloseTo(BASE_WEIGHTS.cuisine / 0.8);
    expect(result?.weights.transit).toBeCloseTo(BASE_WEIGHTS.transit / 0.8);
    expect(result?.weights.experience).toBeCloseTo(BASE_WEIGHTS.experience / 0.8);
    expect((result?.weights.cuisine ?? 0) + (result?.weights.transit ?? 0) + (result?.weights.experience ?? 0)).toBeCloseTo(1);
    expect(result?.explanation.toLowerCase()).not.toContain("fits your budget");
  });

  it("prefers the place closer to a station when time is flexible", () => {
    const near = place({ id: "near", name: "Near Noodle", category: "restaurant", lat: 42.3502, lon: -71.1, cuisineFamily: "asian", cuisineRaw: "ramen", cuisineLabel: "Ramen", cuisineMatchLabel: "Ramen" });
    const far = place({ id: "far", name: "Far Noodle", category: "restaurant", lat: 42.38, lon: -71.1, cuisineFamily: "asian", cuisineRaw: "ramen", cuisineLabel: "Ramen", cuisineMatchLabel: "Ramen" });
    const [first] = recommend([far, near], [origin], [campus], prefs({ cuisine: "asian", time: "flexible" }));
    expect(first?.place.id).toBe("near");
    expect(first?.stationMiles).toBeLessThan(0.1);
    expect(first?.explanation).toContain("under 0.1 mi");
  });

  it("can switch to a nearby step-free station", () => {
    const spot = place({ id: "spot", name: "Step Free Cafe", category: "cafe", lat: 42.351, lon: -71.1, cuisineFamily: "coffee-desserts" });
    const start = station({ id: "start", name: "Start", lat: 42.35, lon: -71.1, wheelchair: "inaccessible", wheelchairBoarding: 2 });
    const blocked = station({ id: "blocked", name: "Blocked Stop", lat: 42.3511, lon: -71.1, wheelchair: "inaccessible", wheelchairBoarding: 2 });
    const open = station({ id: "open", name: "Open Stop", lat: 42.354, lon: -71.1, wheelchair: "accessible", wheelchairBoarding: 1 });
    const stepCampus: Campus = { ...campus, stationId: start.id, stationName: start.name };
    const standard = recommend([spot], [start, blocked, open], [stepCampus], prefs({ stepFree: false, experience: "study-cafe" }));
    const stepFree = recommend([spot], [start, blocked, open], [stepCampus], prefs({ stepFree: true, experience: "study-cafe" }));
    expect(standard[0]?.station.id).toBe("blocked");
    expect(stepFree[0]?.station.id).toBe("open");
    expect(stepFree[0]?.explanation).toContain("step-free boarding");
  });

  it("caps repeated names when other places are available", () => {
    const items = [
      { place: { id: "d1", name: "Dunkin'" } },
      { place: { id: "d2", name: "Dunkin" } },
      { place: { id: "d3", name: "Dunkin'" } },
      { place: { id: "a", name: "Alpha Cafe" } },
      { place: { id: "b", name: "Beta Bakery" } },
      { place: { id: "c", name: "Cedar Kitchen" } },
      { place: { id: "e", name: "Elm Park" } },
    ];
    const chosen = selectDiverse(items, 5, 1);
    const dunkin = chosen.filter((item) => item.place.name.toLowerCase().startsWith("dunkin"));
    expect(chosen).toHaveLength(5);
    expect(dunkin).toHaveLength(1);
  });

  it("builds a transit directions link from the start station", () => {
    const target = place({ id: "target", name: "Target Cafe", category: "cafe", lat: 42.36, lon: -71.06 });
    const [result] = recommend([target], [origin], [campus], prefs());
    const url = new URL(result?.mapsUrl ?? transitDirectionsUrl(origin, target));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("travelmode")).toBe("transit");
    expect(url.searchParams.get("origin")).toBe(`${origin.lat},${origin.lon}`);
    expect(url.searchParams.get("destination")).toBe(`${target.lat},${target.lon}`);
  });
});

describe("real Boston dataset", () => {
  it("keeps verified campuses and rapid transit lines", () => {
    expect(places.length).toBeGreaterThanOrEqual(40);
    expect(stations.length).toBeGreaterThanOrEqual(40);
    expect(campuses.find((item) => item.id === "harvard")?.stationName).toBe("Harvard");
    expect(campuses.find((item) => item.id === "downtown")?.stationName).toBe("Park Street");
    expect(campuses.find((item) => item.id === "bu")?.stationName).toBe("Boston University Central");
    const groups = new Set(stations.flatMap((item) => item.lines.map((line) => line.group)));
    expect(groups.has("Red")).toBe(true);
    expect(groups.has("Orange")).toBe(true);
    expect(groups.has("Blue")).toBe(true);
    expect(groups.has("Green")).toBe(true);
    for (const placeRecord of places) {
      if (placeRecord.budget.status === "unknown") expect(placeRecord.budget.tier).toBeNull();
    }
  });

  it("returns a sample trip of real places with transit links", () => {
    const results = recommend(places, stations, campuses, SAMPLE_TRIP);
    expect(results).toHaveLength(6);
    const asian = results.filter((result) => result.place.cuisineFamily === "asian");
    expect(asian.length).toBeGreaterThanOrEqual(3);
    const originStation = stations.find((item) => item.id === campuses.find((campusItem) => campusItem.id === "bu")?.stationId);
    for (const result of results) {
      expect(result.place.name.length).toBeGreaterThan(1);
      expect(result.stationMiles).toBeLessThan(2.5);
      expect(Number.isFinite(result.originMiles)).toBe(true);
      const url = new URL(result.mapsUrl);
      expect(url.searchParams.get("travelmode")).toBe("transit");
      expect(url.searchParams.get("origin")).toBe(`${originStation?.lat},${originStation?.lon}`);
      if (result.budgetScore !== 1) expect(result.explanation.toLowerCase()).not.toContain("fits your budget");
    }
    const study = recommend(places, stations, campuses, STUDY_TRIP);
    const weekend = recommend(places, stations, campuses, WEEKEND_TRIP);
    expect(study).toHaveLength(6);
    expect(study[0]?.place.cuisineFamily).toBe("coffee-desserts");
    expect(study[0]?.originMiles).toBeLessThan(0.5);
    expect(weekend).toHaveLength(6);
    expect(weekend.some((result) => result.place.budget.status === "free")).toBe(true);
    expect(results[0]?.originMiles).toBeLessThan(0.5);
  });
});
