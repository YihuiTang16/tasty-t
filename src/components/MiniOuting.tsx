import { haversineMiles } from "../lib/geo.ts";
import type { Recommendation } from "../types.ts";

interface MiniOutingProps {
  results: Recommendation[];
}

const FOOD_CATEGORIES = new Set(["restaurant", "cafe", "fast_food", "food_court", "ice_cream", "bakery", "sweets"]);
const ACTIVITY_CATEGORIES = new Set(["museum", "gallery", "theatre", "cinema", "arts_centre", "park", "garden", "attraction"]);

export function MiniOuting({ results }: MiniOutingProps) {
  let bestPair: { food: Recommendation; activity: Recommendation; miles: number } | null = null;

  for (const food of results.filter((item) => FOOD_CATEGORIES.has(item.place.category))) {
    for (const activity of results.filter((item) => ACTIVITY_CATEGORIES.has(item.place.category))) {
      const miles = haversineMiles(food.place.lat, food.place.lon, activity.place.lat, activity.place.lon);
      if (!bestPair || miles < bestPair.miles) bestPair = { food, activity, miles };
    }
  }

  if (!bestPair || bestPair.miles > 1.5) return null;

  const directionsUrl = new URL("https://www.google.com/maps/dir/");
  directionsUrl.searchParams.set("api", "1");
  directionsUrl.searchParams.set("origin", `${bestPair.food.place.lat},${bestPair.food.place.lon}`);
  directionsUrl.searchParams.set("destination", `${bestPair.activity.place.lat},${bestPair.activity.place.lon}`);
  directionsUrl.searchParams.set("travelmode", "walking");

  return (
    <aside className="mb-5 rounded-3xl border border-accent/40 bg-accent/5 p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent-dark uppercase">A little more than a meal</p>
      <h3 className="mt-1 font-display text-2xl text-ink">Pair a bite with a nearby side quest</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Grab a bite at <span className="font-semibold text-ink">{bestPair.food.place.name}</span>, then visit{" "}
        <span className="font-semibold text-ink">{bestPair.activity.place.name}</span> about {bestPair.miles.toFixed(1)} straight-line miles away.
        The walking link opens Google Maps for the actual route.
      </p>
      <a
        href={directionsUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-paper transition hover:bg-harbor"
      >
        Walking directions →
      </a>
    </aside>
  );
}
