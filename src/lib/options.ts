import type { BudgetTier, CuisineChoice, ExperienceChoice, TimeChoice } from "../types.ts";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export const BUDGET_OPTIONS: readonly ChoiceOption<BudgetTier>[] = [
  { value: "under-15", label: "Under $15", description: "Free listings and low listed charges rank higher." },
  { value: "15-25", label: "$15–$25" },
  { value: "25-40", label: "$25–$40" },
  { value: "40-plus", label: "$40+" },
];

export const CUISINE_OPTIONS: readonly ChoiceOption<CuisineChoice>[] = [
  { value: "asian", label: "Asian" },
  { value: "american", label: "American" },
  { value: "italian", label: "Italian" },
  { value: "coffee-desserts", label: "Coffee & Desserts" },
  { value: "any", label: "Any" },
];

export const EXPERIENCE_OPTIONS: readonly ChoiceOption<ExperienceChoice>[] = [
  { value: "quick-bite", label: "Quick bite" },
  { value: "study-cafe", label: "Study-friendly cafe" },
  { value: "date-night", label: "Date night" },
  { value: "explore", label: "Explore the city" },
  { value: "weekend", label: "Weekend adventure" },
];

export const TIME_OPTIONS: readonly ChoiceOption<TimeChoice>[] = [
  { value: "1h", label: "Stay near campus", description: "Gives more weight to places close to your starting station." },
  { value: "2h", label: "Explore nearby areas" },
  { value: "half-day", label: "Explore the city" },
  { value: "flexible", label: "Anywhere on the map" },
];

export function optionLabel<T extends string>(options: readonly ChoiceOption<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
