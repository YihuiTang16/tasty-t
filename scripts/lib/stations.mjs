import { CAMPUSES, FALLBACK_LINE_COLORS, LINE_ORDER } from "./constants.mjs";

function hexColor(value) {
  if (!value || typeof value !== "string") return null;
  const raw = value.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toUpperCase()}`;
}

function presentLine(route) {
  const routeId = route.id;
  const attrs = route.attributes ?? {};
  let group = routeId;
  let branch = null;
  let label = attrs.long_name || routeId;

  if (routeId === "Green" || routeId.startsWith("Green-")) {
    group = "Green";
    branch = routeId.includes("-") ? routeId.split("-")[1] : null;
    label = "Green Line";
  } else if (routeId === "Red") {
    group = "Red";
    label = "Red Line";
  } else if (routeId === "Orange") {
    group = "Orange";
    label = "Orange Line";
  } else if (routeId === "Blue") {
    group = "Blue";
    label = "Blue Line";
  } else if (routeId === "Mattapan") {
    group = "Mattapan";
    label = attrs.long_name || "Mattapan Trolley";
  }

  let color = hexColor(attrs.color);
  let textColor = hexColor(attrs.text_color);
  let colorSource = color ? "mbta" : "missing";
  if (!color && FALLBACK_LINE_COLORS[group]) {
    color = FALLBACK_LINE_COLORS[group][0];
    textColor = textColor || FALLBACK_LINE_COLORS[group][1];
    colorSource = "fallback";
  }

  return {
    id: routeId,
    group,
    branch,
    label,
    color,
    textColor,
    colorSource,
    vehicle: attrs.type === 0 ? "light-rail" : "subway",
  };
}

function lineSort(a, b) {
  const groupDelta = (LINE_ORDER.indexOf(a.group) + 1 || 99) - (LINE_ORDER.indexOf(b.group) + 1 || 99);
  if (groupDelta !== 0) return groupDelta;
  return (a.branch || "").localeCompare(b.branch || "");
}

function wheelchairLabel(value) {
  if (value === 1) return "accessible";
  if (value === 2) return "inaccessible";
  return "unknown";
}

function parentIdOf(stop) {
  return stop.relationships?.parent_station?.data?.id ?? null;
}

/**
 * @param {{ routes: Array<Record<string, any>>, stopsByRoute: Record<string, Array<Record<string, any>>>, parents?: Array<Record<string, any>> }} raw
 */
export function cleanStations(raw) {
  const routeById = new Map(raw.routes.map((route) => [route.id, route]));
  const stops = new Map();

  for (const [routeId, list] of Object.entries(raw.stopsByRoute)) {
    for (const stop of list) {
      const existing = stops.get(stop.id);
      if (existing) {
        existing.routeIds.add(routeId);
      } else {
        stops.set(stop.id, { ...stop, routeIds: new Set([routeId]) });
      }
    }
  }

  for (const parent of raw.parents ?? []) {
    if (!stops.has(parent.id)) {
      stops.set(parent.id, { ...parent, routeIds: new Set() });
    }
  }

  const rolled = new Map();

  for (const stop of stops.values()) {
    const locationType = stop.attributes?.location_type;
    if (locationType === 2 || locationType === 3 || locationType === 4) continue;

    const parentId = parentIdOf(stop);
    const parent = parentId ? stops.get(parentId) : null;
    const target = parent ?? stop;
    if (parent && locationType !== 1 && stop.id !== parent.id) {
      const bucket = rolled.get(parent.id) ?? {
        stop: parent,
        routeIds: new Set(parent.routeIds ?? []),
        childCoords: [],
      };
      for (const routeId of stop.routeIds) bucket.routeIds.add(routeId);
      if (Number.isFinite(stop.attributes?.latitude) && Number.isFinite(stop.attributes?.longitude)) {
        bucket.childCoords.push([stop.attributes.latitude, stop.attributes.longitude]);
      }
      rolled.set(parent.id, bucket);
      continue;
    }

    const bucket = rolled.get(target.id) ?? {
      stop: target,
      routeIds: new Set(),
      childCoords: [],
    };
    for (const routeId of stop.routeIds ?? []) bucket.routeIds.add(routeId);
    rolled.set(target.id, bucket);
  }

  const stations = [];
  for (const bucket of rolled.values()) {
    const attrs = bucket.stop.attributes ?? {};
    let lat = attrs.latitude;
    let lon = attrs.longitude;
    let coordinateFrom = "station";
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      const child = bucket.childCoords[0];
      if (!child) continue;
      [lat, lon] = child;
      coordinateFrom = "child-stop";
    }

    const lines = [...bucket.routeIds]
      .map((routeId) => routeById.get(routeId))
      .filter(Boolean)
      .map(presentLine)
      .sort(lineSort);

    if (lines.length === 0) continue;
    const wheelchairBoarding = Number.isInteger(attrs.wheelchair_boarding) ? attrs.wheelchair_boarding : 0;

    stations.push({
      id: bucket.stop.id,
      name: attrs.name,
      lat,
      lon,
      municipality: attrs.municipality ?? null,
      wheelchairBoarding,
      wheelchair: wheelchairLabel(wheelchairBoarding),
      coordinateFrom,
      lines,
      source: "MBTA V3 API",
      provider: "MassDOT",
    });
  }

  stations.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  return stations.filter((station) => station.name && Number.isFinite(station.lat) && Number.isFinite(station.lon));
}

export function buildCampuses(stations) {
  return CAMPUSES.map((campus) => {
    let station = null;
    for (const name of campus.stationNames) {
      station = stations.find((item) => item.name.toLowerCase() === name.toLowerCase()) ?? null;
      if (station) break;
    }
    if (!station) {
      const sample = stations
        .filter((item) => campus.stationNames.some((name) => item.name.toLowerCase().includes(name.toLowerCase().slice(0, 8))))
        .map((item) => item.name)
        .slice(0, 8);
      throw new Error(
        `Could not match ${campus.label} to a station. Tried: ${campus.stationNames.join(", ")}. Nearby names: ${sample.join(", ") || "none"}`,
      );
    }
    return {
      id: campus.id,
      label: campus.label,
      shortLabel: campus.shortLabel,
      stationId: station.id,
      stationName: station.name,
    };
  });
}
