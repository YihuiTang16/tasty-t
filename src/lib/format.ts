import type { LineInfo } from "../types.ts";

export function formatMiles(miles: number): string {
  if (!Number.isFinite(miles)) return "unknown distance";
  if (miles < 0.1) return "under 0.1 mi";
  return `${miles.toFixed(1)} mi`;
}

export function formatStationLines(lines: LineInfo[]): string {
  const groups: { label: string; branches: string[] }[] = [];
  for (const line of lines) {
    const existing = groups.find((group) => group.label === line.label);
    if (existing) {
      if (line.branch && !existing.branches.includes(line.branch)) existing.branches.push(line.branch);
    } else {
      groups.push({ label: line.label, branches: line.branch ? [line.branch] : [] });
    }
  }
  return groups
    .map((group) => (group.branches.length > 0 ? `${group.label} ${group.branches.join(", ")}` : group.label))
    .join(" · ");
}

export function formatRetrieved(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "an unknown date";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function transitDirectionsUrl(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode: "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function scrollToId(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
