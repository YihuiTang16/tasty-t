export const CATEGORIES = [
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
] as const;

export type Category = (typeof CATEGORIES)[number];

export type CuisineFamily =
  | "asian"
  | "american"
  | "italian"
  | "coffee-desserts"
  | "other"
  | "unknown"
  | "not-food";

export type BudgetTier = "under-15" | "15-25" | "25-40" | "40-plus";
export type BudgetStatus = "free" | "listed" | "unknown";
export type CuisineChoice = "asian" | "american" | "italian" | "coffee-desserts" | "any";
export type ExperienceChoice = "quick-bite" | "study-cafe" | "date-night" | "explore" | "weekend";
export type TimeChoice = "1h" | "2h" | "half-day" | "flexible";

export interface BudgetInfo {
  status: BudgetStatus;
  tier: BudgetTier | null;
  label: string;
  evidence: string;
}

export interface Place {
  id: string;
  name: string;
  category: Category;
  categoryLabel: string;
  cuisineFamily: CuisineFamily;
  cuisineRaw: string | null;
  cuisineLabel: string | null;
  cuisineMatchLabel: string | null;
  lat: number;
  lon: number;
  address: string | null;
  city: string | null;
  website: string | null;
  openingHours: string | null;
  openingHoursScope: "general" | "kitchen" | null;
  wikipedia: string | null;
  wikidata: string | null;
  budget: BudgetInfo;
  source: "OpenStreetMap";
  sourceId: string;
  osmType: string;
  osmId: number;
}

export interface LineInfo {
  id: string;
  group: string;
  branch: string | null;
  label: string;
  color: string | null;
  textColor: string | null;
  colorSource: string;
  vehicle: "light-rail" | "subway";
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  municipality: string | null;
  wheelchairBoarding: number;
  wheelchair: "accessible" | "inaccessible" | "unknown";
  coordinateFrom: "station" | "child-stop";
  lines: LineInfo[];
  source: string;
  provider: "MassDOT";
}

export interface Campus {
  id: string;
  label: string;
  shortLabel: string;
  stationId: string;
  stationName: string;
}

export interface TripPreferences {
  campusId: string;
  budget: BudgetTier;
  cuisine: CuisineChoice;
  experience: ExperienceChoice;
  time: TimeChoice;
  stepFree: boolean;
}

export interface TripDraft {
  campusId: string | null;
  budget: BudgetTier | null;
  cuisine: CuisineChoice | null;
  experience: ExperienceChoice | null;
  time: TimeChoice | null;
  stepFree: boolean;
}

export interface ScoreWeights {
  cuisine: number;
  transit: number;
  budget: number;
  experience: number;
}

export interface Recommendation {
  place: Place;
  score: number;
  cuisineScore: number;
  transitScore: number;
  budgetScore: number | null;
  experienceScore: number;
  weights: ScoreWeights;
  station: Station;
  stationMiles: number;
  originMiles: number;
  explanation: string;
  mapsUrl: string;
}
