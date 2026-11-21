import { useMemo, useState } from "react";
import { DiscoveryForm } from "./components/DiscoveryForm.tsx";
import { Footer } from "./components/Footer.tsx";
import { LineDots } from "./components/LineDots.tsx";
import { Results } from "./components/Results.tsx";
import { campuses, meta, places, stations } from "./data/index.ts";
import { scrollToId } from "./lib/format.ts";
import { recommend } from "./lib/recommend.ts";
import type { LineInfo, TripDraft, TripPreferences } from "./types.ts";

const EMPTY_DRAFT: TripDraft = {
  campusId: null,
  budget: null,
  cuisine: null,
  experience: null,
  time: null,
  stepFree: false,
  lateNightOnly: false,
};

const LINE_ORDER = ["Red", "Orange", "Blue", "Green", "Mattapan"];

function lineLegend(): LineInfo[] {
  const byGroup = new Map<string, LineInfo>();
  for (const station of stations) {
    for (const line of station.lines) {
      if (!byGroup.has(line.group)) byGroup.set(line.group, line);
    }
  }
  return LINE_ORDER.flatMap((group) => {
    const line = byGroup.get(group);
    return line ? [line] : [];
  });
}

export default function App() {
  const [draft, setDraft] = useState<TripDraft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<TripPreferences | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedTrip, setPickedTrip] = useState<string | null>(null);
  const [followedId, setFollowedId] = useState<string | null>(null);
  const [followedTrip, setFollowedTrip] = useState<string | null>(null);
  const legend = lineLegend();

  const outcome = useMemo(() => {
    if (!submitted) return { results: [], error: null as string | null };
    try {
      return { results: recommend(places, stations, campuses, submitted), error: null };
    } catch (error) {
      return { results: [], error: error instanceof Error ? error.message : "The places could not be ranked." };
    }
  }, [submitted]);

  const tripKey = submitted ? JSON.stringify(submitted) : "";
  const selectedId =
    pickedTrip === tripKey && outcome.results.some((result) => result.place.id === pickedId)
      ? pickedId
      : (outcome.results[0]?.place.id ?? null);
  const activeFollowedId = followedTrip === tripKey ? followedId : null;

  const campus = campuses.find((item) => item.id === submitted?.campusId) ?? null;
  const origin = stations.find((station) => station.id === campus?.stationId) ?? null;

  function applyTrip(trip: TripPreferences) {
    setDraft({ ...EMPTY_DRAFT, ...trip, lateNightOnly: trip.lateNightOnly ?? false });
    setFieldErrors([]);
    setPickedId(null);
    setFollowedId(null);
    setSubmitted(trip);
    requestAnimationFrame(() => scrollToId("results"));
  }

  function submitDraft() {
    const campusId = draft.campusId;
    const budget = draft.budget;
    const cuisine = draft.cuisine;
    const experience = draft.experience;
    const time = draft.time;
    const missing = [
      campusId ? null : "campus",
      budget ? null : "budget",
      cuisine ? null : "cuisine",
      experience ? null : "experience",
      time ? null : "time",
    ].filter((item): item is string => item !== null);
    setFieldErrors(missing);
    if (!campusId || !budget || !cuisine || !experience || !time) {
      document.getElementById(`field-${missing[0]}`)?.focus();
      return;
    }
    applyTrip({ campusId, budget, cuisine, experience, time, stepFree: draft.stepFree, lateNightOnly: draft.lateNightOnly });
  }

  function focusFromCard(id: string) {
    setPickedTrip(tripKey);
    setPickedId(id);
    setFollowedTrip(tripKey);
    setFollowedId(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("trip-map")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  function focusFromMap(id: string) {
    setPickedTrip(tripKey);
    setPickedId(id);
    setFollowedTrip(tripKey);
    setFollowedId(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`place-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  if (places.length === 0 || stations.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20">
        <h1 className="font-display text-4xl">The local dataset is missing.</h1>
        <p className="mt-3 text-muted">Run npm run data:build, then start the app again.</p>
      </main>
    );
  }

  return (
    <div id="top" className="min-h-screen">
      <a href="#plan" className="skip-link">
        Skip to the trip form
      </a>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-2 text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-semibold text-paper">Tt</span>
            <span className="font-display text-2xl leading-none">Tasty T</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="#how" className="hidden text-sm font-medium text-muted sm:inline">
              How ranking works
            </a>
            <a
              href="#plan"
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-paper transition hover:bg-harbor"
            >
              Plan a trip
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-accent-dark uppercase">Boston, without a car</p>
            <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.95] text-ink sm:text-6xl">
              Find your next bite. Take the T there.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-7 text-muted">
              Choose your campus, budget, and kind of outing. Tasty T ranks Boston food and local spots around your preferences, then shows nearby MBTA stations and transit directions.
            </p>
            <dl className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
              <div className="rounded-2xl bg-card px-3 py-3">
                <dt className="text-xs text-muted">Places</dt>
                <dd className="font-display text-2xl">{meta.placeCount.toLocaleString("en-US")}</dd>
              </div>
              <div className="rounded-2xl bg-card px-3 py-3">
                <dt className="text-xs text-muted">Stations</dt>
                <dd className="font-display text-2xl">{meta.stationCount.toLocaleString("en-US")}</dd>
              </div>
              <div className="rounded-2xl bg-card px-3 py-3">
                <dt className="text-xs text-muted">Lines</dt>
                <dd className="mt-2">
                  <LineDots lines={legend} />
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {legend.map((line) => (
                <span key={line.group} className="inline-flex items-center gap-1.5">
                  <LineDots lines={[line]} />
                  {line.label}
                </span>
              ))}
            </p>
          </div>
          <div id="plan" className="scroll-mt-24">
            <DiscoveryForm
              draft={draft}
              fieldErrors={fieldErrors}
              campuses={campuses}
              stations={stations}
              hasResults={submitted !== null}
              onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
              onSubmit={submitDraft}
              onPreset={applyTrip}
            />
          </div>
        </section>

        <section id="how" className="mt-8 scroll-mt-24">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["35%", "Cuisine", "A known cuisine family, or a cafe, bakery, or ice cream amenity."],
              ["30%", "Transit", "Straight-line distance to your start and to a rapid transit station. Closer ranks higher."],
              ["20%", "Budget", "Used only for a listed fee or charge. Otherwise the weight is dropped."],
              ["15%", "Experience", "Category fit for the outing you picked, from the OpenStreetMap tag."],
            ].map(([figure, title, copy]) => (
              <article key={title} className="rounded-3xl border border-line bg-card/80 px-4 py-4">
                <p className="font-display text-3xl text-accent-dark">{figure}</p>
                <h2 className="mt-1 font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-muted">{copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Your exploration range changes how strongly proximity to your campus station affects the ranking. Distances are straight-line estimates, not ride times. For city and weekend outings, destination parks rank higher than small neighborhood parks. A match score reflects your preferences, not reviews.
          </p>
        </section>

        <div className="mt-10">
          <Results
            submitted={submitted}
            results={outcome.results}
            error={outcome.error}
            origin={origin}
            campusLabel={campus?.label ?? "your campus"}
            selectedId={selectedId}
            followedId={activeFollowedId}
            onViewMap={focusFromCard}
            onMarker={focusFromMap}
          />
        </div>
      </main>

      <Footer
        placeCount={meta.placeCount}
        stationCount={meta.stationCount}
        osmRetrievedAt={meta.osmRetrievedAt}
        mbtaRetrievedAt={meta.mbtaRetrievedAt}
        osmLicenseUrl={meta.licenses.places.url}
        massdotAgreementUrl={meta.licenses.stations.url}
      />
    </div>
  );
}
