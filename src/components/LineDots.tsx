import type { LineInfo } from "../types.ts";

const GROUP_ORDER = ["Red", "Orange", "Blue", "Green", "Mattapan"];

export function LineDots({ lines }: { lines: LineInfo[] }) {
  const unique: LineInfo[] = [];
  for (const line of lines) {
    if (unique.some((item) => item.group === line.group)) continue;
    unique.push(line);
  }
  unique.sort(
    (a, b) =>
      (GROUP_ORDER.indexOf(a.group) + 1 || 99) - (GROUP_ORDER.indexOf(b.group) + 1 || 99),
  );

  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1">
      {unique.map((line) => (
        <span
          key={line.group}
          className="h-2.5 w-2.5 rounded-full border border-white/70"
          style={{ backgroundColor: line.color ?? "#1c1915" }}
        />
      ))}
    </span>
  );
}
