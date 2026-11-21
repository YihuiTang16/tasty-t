import { RadioGroup } from "./RadioGroup.tsx";
import { describeTrip, LATE_NIGHT_TRIP, SAMPLE_TRIP, STUDY_TRIP, WEEKEND_TRIP } from "../lib/presets.ts";
import { BUDGET_OPTIONS, CUISINE_OPTIONS, EXPERIENCE_OPTIONS, TIME_OPTIONS } from "../lib/options.ts";
import type { BudgetTier, Campus, CuisineChoice, ExperienceChoice, Station, TimeChoice, TripDraft, TripPreferences } from "../types.ts";

const FIELD_ERRORS: Record<string, string> = {
  campus: "Choose a starting point.",
  budget: "Choose a budget.",
  cuisine: "Choose a cuisine.",
  experience: "Choose an experience.",
  time: "Choose how far you want to explore.",
};

interface DiscoveryFormProps {
  draft: TripDraft;
  fieldErrors: string[];
  campuses: Campus[];
  stations: Station[];
  hasResults: boolean;
  onChange: (patch: Partial<TripDraft>) => void;
  onSubmit: () => void;
  onPreset: (trip: TripPreferences) => void;
}

export function DiscoveryForm({
  draft,
  fieldErrors,
  campuses,
  stations,
  hasResults,
  onChange,
  onSubmit,
  onPreset,
}: DiscoveryFormProps) {
  const campusOptions = campuses.map((campus) => {
    const station = stations.find((item) => item.id === campus.stationId);
    return {
      value: campus.id,
      label: campus.label,
      description: station?.name ?? campus.stationName,
      lines: station?.lines ?? [],
    };
  });

  function errorFor(name: string) {
    return fieldErrors.includes(name) ? FIELD_ERRORS[name] : undefined;
  }

  return (
    <form
      className="rounded-[28px] border border-line bg-card p-4 shadow-[0_24px_60px_-36px_rgba(28,25,21,0.55)] sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent-dark uppercase">Plan a trip</p>
          <h2 className="font-display text-3xl text-ink">Build your Boston outing</h2>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent-dark uppercase">Quick plans</p>
        <p className="mt-1 text-sm text-muted">Pick a starting point, then customize every detail below if you like.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { title: "BU food date", trip: SAMPLE_TRIP, campus: "Boston University" },
            { title: "Study cafe", trip: STUDY_TRIP, campus: "Northeastern University" },
            { title: "Free weekend outing", trip: WEEKEND_TRIP, campus: "Harvard University" },
            { title: "Late-night bites", trip: LATE_NIGHT_TRIP, campus: "Boston University" },
          ].map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => onPreset(preset.trip)}
              className="min-h-24 rounded-2xl border border-line bg-paper px-3 py-3 text-left transition hover:border-accent hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-harbor"
            >
              <span className="block text-sm font-semibold">{preset.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{describeTrip(preset.trip, preset.campus)}</span>
              {preset.trip.lateNightOnly ? <span className="mt-1 block text-xs text-muted">Only listings verified as open 24/7</span> : null}
              <span className="mt-2 block text-xs font-semibold text-accent-dark">Use this plan →</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 border-t border-line pt-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent-dark uppercase">Make it yours</p>
        <p className="mt-1 text-sm text-muted">Customize your starting point and preferences.</p>
      </div>

      <div className="grid gap-5">
        <RadioGroup
          name="campus"
          label="Starting point"
          hint="Each campus uses a real MBTA station as the transit origin."
          value={draft.campusId}
          options={campusOptions}
          error={errorFor("campus")}
          onChange={(campusId) => onChange({ campusId })}
        />
        <RadioGroup
          name="budget"
          label="Budget"
          hint="Price information can be missing. When OpenStreetMap has no listed fee or charge, we label it unknown and leave it out of budget scoring."
          value={draft.budget}
          options={BUDGET_OPTIONS}
          error={errorFor("budget")}
          onChange={(budget: BudgetTier) => onChange({ budget })}
        />
        <RadioGroup
          name="cuisine"
          label="Cuisine"
          value={draft.cuisine}
          options={CUISINE_OPTIONS}
          error={errorFor("cuisine")}
          onChange={(cuisine: CuisineChoice) => onChange({ cuisine })}
        />
        <RadioGroup
          name="experience"
          label="Experience"
          value={draft.experience}
          options={EXPERIENCE_OPTIONS}
          error={errorFor("experience")}
          onChange={(experience: ExperienceChoice) => onChange({ experience })}
        />
        <RadioGroup
          name="time"
          label="How far do you want to explore?"
          hint="This changes how strongly distance from your campus station affects ranking. Distances are straight-line, not MBTA ride times."
          value={draft.time}
          options={TIME_OPTIONS}
          error={errorFor("time")}
          onChange={(time: TimeChoice) => onChange({ time })}
        />

        <label className="flex items-start gap-3 rounded-2xl border border-line bg-paper px-3 py-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-harbor"
            checked={draft.stepFree}
            onChange={(event) => onChange({ stepFree: event.target.checked })}
          />
          <span>
            <span className="block font-medium">Prefer a step-free station</span>
            <span className="block text-sm text-muted">
              Uses the MBTA wheelchair boarding field. If that field is empty, the station stays unknown.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-white transition hover:bg-accent-dark"
        >
          {hasResults ? "Update places" : "Find places on the T"}
        </button>
      </div>

    </form>
  );
}
