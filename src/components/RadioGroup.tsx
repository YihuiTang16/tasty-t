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
      <legend className="mb-2 font-semibold text-[#294b60]">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
              className={`flex min-h-12 w-full items-start gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition ${
                selected
                  ? "border-[#07536b] ring-1 ring-[#07536b] text-ink"
                  : "border-[#d7e1e6] text-ink hover:border-[#07536b]/60"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  selected ? "bg-[#07536b] text-white" : "bg-[#dce6e9] text-transparent"
                }`}
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                  <path d="m3.5 8.2 3 3 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {option.lines && option.lines.length > 0 ? <LineDots lines={option.lines} /> : null}
                  <span className="font-medium">{option.label}</span>
                </span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs leading-4 text-muted">{option.description}</span>
                ) : null}
              </span>
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
