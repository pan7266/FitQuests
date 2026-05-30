import { cn } from "../../utils/classNames";

export interface SegmentOption<TValue extends string> {
  label: string;
  value: TValue;
}

interface SegmentedControlProps<TValue extends string> {
  label: string;
  options: SegmentOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
}

export function SegmentedControl<TValue extends string>({
  label,
  options,
  value,
  onChange
}: SegmentedControlProps<TValue>) {
  return (
    <fieldset className="app-inset grid rounded-2xl p-1">
      <legend className="sr-only">{label}</legend>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            aria-pressed={option.value === value}
            className={cn(
              "focus-ring min-h-10 rounded-xl px-2 text-sm font-bold transition",
              option.value === value
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
                : "text-app-muted hover:text-app"
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
