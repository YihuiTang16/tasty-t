import { ArrowUpRight, TrainFront } from "lucide-react";
import { LineDots } from "./LineDots.tsx";
import { formatMiles, formatStationLines } from "../lib/format.ts";
import type { Recommendation } from "../types.ts";

interface PlaceCardProps {
  result: Recommendation;
  index: number;
  selected: boolean;
  originName: string;
  onViewMap: () => void;
}

function budgetClass(status: Recommendation["place"]["budget"]["status"]) {
  if (status === "free") return "bg-pine/10 text-pine";
  if (status === "listed") return "bg-harbor/10 text-harbor";
  return "bg-paper-deep text-muted";
}

function accessLabel(wheelchair: Recommendation["station"]["wheelchair"]) {
  if (wheelchair === "accessible") return "Step-free station";
  if (wheelchair === "inaccessible") return "Station not step-free";
  return "Step-free status not listed";
}

export function PlaceCard({ result, index, selected, originName, onViewMap }: PlaceCardProps) {
  const { place, station } = result;
  const hoursLabel = place.openingHoursScope === "kitchen" ? "Kitchen hours on OpenStreetMap" : "Hours on OpenStreetMap";

  return (
    <article
      id={`place-${place.id}`}
      className={`rounded-[28px] border bg-card p-4 shadow-[0_18px_40px_-32px_rgba(28,25,21,0.7)] sm:p-5 ${
        selected ? "border-accent ring-2 ring-accent/70" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-3xl text-ink/25">{String(index + 1).padStart(2, "0")}</p>
        <p className="text-right" aria-label={`Preference fit score ${Math.round(result.score * 100)} out of 100`}>
          <span className="font-display block text-3xl leading-none">{Math.round(result.score * 100)}</span>
          <span className="text-[11px] tracking-[0.08em] text-muted uppercase">fit score</span>
        </p>
      </div>

      <h3 className="mt-2 font-display text-3xl leading-tight text-ink">{place.name}</h3>
      <p className="mt-1 text-sm text-muted">
        {place.categoryLabel}
        {place.cuisineLabel ? ` · ${place.cuisineLabel}` : ""}
        {place.city ? ` · ${place.city}` : ""}
      </p>

      <div className="mt-4 grid gap-2 text-sm">
        <p>{place.address ?? "Street address not listed in OpenStreetMap"}</p>
        <p className="flex items-start gap-2">
          <TrainFront className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="mr-2 inline-flex align-middle">
              <LineDots lines={station.lines} />
            </span>
            {formatMiles(result.stationMiles)} from {station.name} · {formatStationLines(station.lines)}
          </span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
        <span className={`rounded-full px-2.5 py-1 ${budgetClass(place.budget.status)}`}>{place.budget.label}</span>
        <span className="rounded-full bg-paper-deep px-2.5 py-1 text-muted">{accessLabel(station.wheelchair)}</span>
      </div>

      <p className="mt-4 text-sm leading-6">
        <span className="font-semibold">Why it fits. </span>
        {result.explanation}
      </p>

      {place.openingHours ? (
        <p className="mt-2 text-sm text-muted">
          {hoursLabel}: {place.openingHours}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onViewMap}
          aria-pressed={selected}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink px-4 text-sm font-semibold transition hover:bg-ink hover:text-paper"
        >
          View on Map
        </button>
        <a
          href={result.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-dark"
        >
          Get Transit Directions
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
        {place.website ? (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-harbor underline-offset-4 hover:underline"
          >
            Website
          </a>
        ) : null}
        {place.wikipedia ? (
          <a
            href={place.wikipedia}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-harbor underline-offset-4 hover:underline"
          >
            Wikipedia
          </a>
        ) : null}
      </div>

      <details className="mt-4 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-ink">Score details and source</summary>
        <dl className="mt-3 grid gap-1">
          <div>{formatMiles(result.originMiles)} from {originName} · straight-line distance from your starting station.</div>
          <div>Cuisine {result.cuisineScore.toFixed(2)} · weight {Math.round(result.weights.cuisine * 100)}%</div>
          <div>Transit {result.transitScore.toFixed(2)} · weight {Math.round(result.weights.transit * 100)}%</div>
          <div>
            Budget {result.budgetScore == null ? "not scored" : result.budgetScore.toFixed(2)} · weight{" "}
            {Math.round(result.weights.budget * 100)}%
          </div>
          <div>Experience {result.experienceScore.toFixed(2)} · weight {Math.round(result.weights.experience * 100)}%</div>
          <div>{place.budget.evidence}</div>
          <div>
            OpenStreetMap {place.sourceId}. Station {station.name} ({station.id}), MBTA wheelchair boarding{" "}
            {station.wheelchairBoarding}.
          </div>
          <div>Distances are straight-line. They are not MBTA travel times.</div>
        </dl>
      </details>
    </article>
  );
}
