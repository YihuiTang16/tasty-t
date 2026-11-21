import { MapErrorBoundary } from "./MapErrorBoundary.tsx";
import { MapPanel } from "./MapPanel.tsx";
import { PlaceCard } from "./PlaceCard.tsx";
import { optionLabel, BUDGET_OPTIONS, CUISINE_OPTIONS, EXPERIENCE_OPTIONS, TIME_OPTIONS } from "../lib/options.ts";
import type { Recommendation, Station, TripPreferences } from "../types.ts";

interface ResultsProps {
  submitted: TripPreferences | null;
  results: Recommendation[];
  error: string | null;
  origin: Station | null;
  campusLabel: string;
  selectedId: string | null;
  followedId: string | null;
  onViewMap: (id: string) => void;
  onMarker: (id: string) => void;
}

export function Results({
  submitted,
  results,
  error,
  origin,
  campusLabel,
  selectedId,
  followedId,
  onViewMap,
  onMarker,
}: ResultsProps) {
  const knownBudget = results.filter((result) => result.budgetScore != null).length;

  return (
    <section id="results" className="scroll-mt-24" aria-live="polite">
      {!submitted ? (
        <div className="rounded-[28px] border border-dashed border-line bg-card/70 px-5 py-10 text-center">
          <h2 className="font-display text-3xl">Your places will land here.</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">
            Choose a quick plan or set your campus, budget, and outing preferences. Your ranked places and map will appear here.
          </p>
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-accent/40 bg-card px-5 py-8" role="alert">
          <h2 className="font-display text-3xl">The ranking could not finish.</h2>
          <p className="mt-2 text-muted">{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-[28px] border border-line bg-card px-5 py-8">
          <h2 className="font-display text-3xl">No places scored for this combination.</h2>
          <p className="mt-2 text-muted">Try Any cuisine, Flexible time, or another campus.</p>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-accent-dark uppercase">Your list</p>
              <h2 className="font-display text-4xl text-ink">
                {results.length} places from {campusLabel}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {optionLabel(CUISINE_OPTIONS, submitted.cuisine)} · {optionLabel(BUDGET_OPTIONS, submitted.budget)} ·{" "}
                {optionLabel(EXPERIENCE_OPTIONS, submitted.experience)} · {optionLabel(TIME_OPTIONS, submitted.time)}
                {submitted.stepFree ? " · Step-free preferred" : ""}
              </p>
            </div>
          </div>

          <p className="mb-4 max-w-3xl text-sm leading-6 text-muted">
            Scores show how well each place fits your selections; they are not reviews or star ratings.{" "}
            {knownBudget === 0
              ? "No prices or fees are listed for these places in OpenStreetMap, so budget was left out of the score instead of guessed."
              : `${knownBudget} of ${results.length} places have a listed price or fee. For the others, budget was left out of the score instead of guessed.`}{" "}
            Transit directions open Google Maps. Tasty T ranks by straight-line proximity and does not predict MBTA ride times.
          </p>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
            <div className="order-2 grid gap-4 lg:order-1">
              {results.map((result, index) => (
                <PlaceCard
                  key={result.place.id}
                  result={result}
                  index={index}
                  selected={result.place.id === selectedId}
                  originName={origin?.name ?? campusLabel}
                  onViewMap={() => onViewMap(result.place.id)}
                />
              ))}
            </div>
            <div className="order-1 lg:sticky lg:top-24 lg:order-2">
              <div id="trip-map" className="isolate h-80 overflow-hidden rounded-[28px] border border-line bg-paper-deep lg:h-[calc(100vh-7.5rem)]">
                <h3 className="sr-only">Map of recommended places</h3>
                {origin ? (
                  <MapErrorBoundary>
                    <MapPanel
                      results={results}
                      origin={origin}
                      selectedId={selectedId}
                      followedId={followedId}
                      onSelect={onMarker}
                    />
                  </MapErrorBoundary>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted">
                Pins match the numbered cards. The start pin is {origin?.name}. Map data © OpenStreetMap contributors.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
