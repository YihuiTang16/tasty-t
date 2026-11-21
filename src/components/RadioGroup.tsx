import type { KeyboardEvent } from "react";
import { LineDots } from "./LineDots.tsx";
import type { LineInfo } from "../types.ts";

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  lines?: LineInfo[];
}

interface RadioGroupProps<T extends string> {
  name: string;
  label: string;
  hint?: string;
  value: T | null;
  options: readonly Option<T>[];
  error?: string;
  onChange: (value: T) => void;
}

function modulo(value: number, size: number) {
  return ((value % size) + size) % size;
}

export function RadioGroup<T extends string>({ name, label, hint, value, options, error, onChange }: RadioGroupProps<T>) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  function onKeyDown(event: KeyboardEvent<HTMLFieldSetElement>) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const current = options.findIndex((option) => option.value === value);
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const start = current < 0 ? (delta > 0 ? -1 : 0) : current;
    const next = options[modulo(start + delta, options.length)];
    if (!next) return;
    onChange(next.value);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <fieldset
      id={`field-${name}`}
      tabIndex={-1}
      role="radiogroup"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : hint ? hintId : undefined}
      onKeyDown={onKeyDown}
      className="min-w-0"
    >
      <legend className="mb-2 font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              data-value={option.value}
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`min-h-11 max-w-full rounded-2xl border px-3 py-2 text-left transition ${
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-card text-ink hover:border-ink/30"
              }`}
            >
              <span className="flex items-center gap-2">
                {option.lines && option.lines.length > 0 ? <LineDots lines={option.lines} /> : null}
                <span className="font-medium">{option.label}</span>
              </span>
              {option.description ? (
                <span className={`mt-0.5 block text-xs ${selected ? "text-paper/75" : "text-muted"}`}>{option.description}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-accent-dark">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
