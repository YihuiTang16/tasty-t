import campusesJson from "./campuses.json" with { type: "json" };
import metaJson from "./meta.json" with { type: "json" };
import placesJson from "./places.json" with { type: "json" };
import stationsJson from "./stations.json" with { type: "json" };
import type { Campus, Place, Station } from "../types.ts";

export const places = placesJson as Place[];
export const stations = stationsJson as Station[];
export const campuses = campusesJson as Campus[];

export const meta = metaJson as {
  retrievedAt: string;
  osmRetrievedAt: string;
  mbtaRetrievedAt: string;
  placeCount: number;
  stationCount: number;
  licenses: {
    places: { attribution: string; url: string; license: string };
    stations: { attribution: string; url: string; agreement: string };
  };
};
