/** Shared bounds and campus station matchers for the Tasty T dataset build. */

export const BBOX = {
  south: 42.315,
  west: -71.175,
  north: 42.41,
  east: -71.015,
};

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

export const MBTA_API = "https://api-v3.mbta.com";

export const USER_AGENT =
  "TastyT/1.0 (BostonHacks BostonBound student project; local dataset build; contact: hackathon project)";

/** Campus labels are ours. Station names must match the MBTA API exactly. */
export const CAMPUSES = [
  {
    id: "bu",
    label: "Boston University",
    shortLabel: "BU",
    stationNames: ["Boston University Central", "Boston University East", "Boston University West"],
  },
  {
    id: "northeastern",
    label: "Northeastern University",
    shortLabel: "Northeastern",
    stationNames: ["Northeastern University", "Northeastern"],
  },
  {
    id: "mit",
    label: "MIT",
    shortLabel: "MIT",
    stationNames: ["Kendall/MIT", "Kendall"],
  },
  {
    id: "harvard",
    label: "Harvard University",
    shortLabel: "Harvard",
    stationNames: ["Harvard"],
  },
  {
    id: "downtown",
    label: "Downtown Boston",
    shortLabel: "Downtown",
    stationNames: ["Park Street", "Downtown Crossing"],
  },
];

export const LINE_ORDER = ["Red", "Orange", "Blue", "Green", "Mattapan"];

/** Used only when a route payload omits color. These are MBTA-published line colors. */
export const FALLBACK_LINE_COLORS = {
  Red: ["#DA291C", "#FFFFFF"],
  Orange: ["#ED8B00", "#FFFFFF"],
  Blue: ["#003DA5", "#FFFFFF"],
  Green: ["#00843D", "#FFFFFF"],
  Mattapan: ["#DA291C", "#FFFFFF"],
};

export const CLEANING_RULES = [
  "Kept named OpenStreetMap nodes, ways, and relations for restaurants, cafes, fast food, bars, ice cream, food courts, bakeries, pastry and confectionery shops, museums, galleries, attractions, parks, gardens, theaters, cinemas, arts centers, and nightclubs inside the Boston/Cambridge bounding box.",
  "Used the name tag, not name:en, so a feature without a primary name was dropped.",
  "Dropped records with missing or non-finite coordinates, coordinates outside the bounding box, or no supported category.",
  "Dropped generic names that are only a category word (for example Restaurant, Cafe, Park) because they are not usable destinations.",
  "Dropped records tagged private or no access, permanently closed (opening_hours closed/off), or disused, abandoned, demolished, or razed.",
  "Dropped statue, plaque, bust, mural, graffiti, artwork, stone, and clock attractions that have no website, Wikipedia, or Wikidata link.",
  "Collapsed duplicate OpenStreetMap ids. Collapsed the same normalized name within 75 meters and kept the record with more source fields.",
  "Did not infer cuisine from the venue name. Cuisine family comes from the cuisine tag, or from the amenity when the amenity itself is a cafe, bakery, sweets shop, or ice cream shop.",
  "Did not invent prices. Budget is free only for fee=no, fee=free, or a simple charge of zero. A simple numeric charge is mapped into a budget tier. Every other place stays unknown.",
  "Addresses are concatenated only from addr:* tags that exist. Missing parts stay blank.",
  "Nearest-station distances are not stored in the place file. The app calculates straight-line distance from MBTA coordinates at ranking time and does not treat that distance as a travel time.",
  "Rapid transit stations are MBTA route types 0 (light rail) and 1 (subway) for Red, Orange, Blue, Green branches, and Mattapan. Entrances and boarding areas are not separate stations. Child stops roll up to their parent station when that parent is in the feed.",
];
