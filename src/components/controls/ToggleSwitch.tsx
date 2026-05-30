import { cn } from "../../utils/classNames";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
  description,
  disabled = false
}: ToggleSwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "focus-ring flex w-full items-center justify-between gap-4 rounded-2xl p-3 text-left transition",
        "hover:bg-[var(--hover-soft)] disabled:opacity-50"
      )}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span>
        <span className="text-app block font-bold">{label}</span>
        {description ? (
          <span className="text-app-soft mt-1 block text-sm">{description}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition",
          checked
            ? "border-[var(--accent)] bg-[var(--accent)] shadow-[var(--accent-glow)]"
            : "border-[var(--border-soft)] bg-[var(--toggle-off)]"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}
