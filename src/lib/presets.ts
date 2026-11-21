import { optionLabel, BUDGET_OPTIONS, CUISINE_OPTIONS, EXPERIENCE_OPTIONS, TIME_OPTIONS } from "./options.ts";
import type { TripPreferences } from "../types.ts";

/** The required sample trip. Budget $25 maps to the $15–$25 range. */
export const SAMPLE_TRIP: TripPreferences = {
  campusId: "bu",
  budget: "15-25",
  cuisine: "asian",
  experience: "date-night",
  time: "2h",
  stepFree: false,
};

export const STUDY_TRIP: TripPreferences = {
  campusId: "northeastern",
  budget: "under-15",
  cuisine: "coffee-desserts",
  experience: "study-cafe",
  time: "1h",
  stepFree: false,
};

export const WEEKEND_TRIP: TripPreferences = {
  campusId: "harvard",
  budget: "under-15",
  cuisine: "any",
  experience: "weekend",
  time: "half-day",
  stepFree: false,
};

export function describeTrip(trip: TripPreferences, campusLabel: string): string {
  return [
    campusLabel,
    optionLabel(BUDGET_OPTIONS, trip.budget),
    optionLabel(CUISINE_OPTIONS, trip.cuisine),
    optionLabel(EXPERIENCE_OPTIONS, trip.experience),
    optionLabel(TIME_OPTIONS, trip.time),
  ].join(" · ");
}
