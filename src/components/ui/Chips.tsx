"use client";

/** Multi-select toggles. Square-cornered, hairline, never pills. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  max,
  render = (o) => o,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  max?: number;
  render?: (o: T) => string;
}) {
  function toggle(o: T) {
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o)}
            className={`rounded-xs border px-3 py-2 text-small font-medium transition-colors duration-(--duration-fast) ${
              on ? "border-bone bg-bone text-field" : "border-line text-bone hover:border-smoke"
            }`}
          >
            {render(o)}
          </button>
        );
      })}
    </div>
  );
}
