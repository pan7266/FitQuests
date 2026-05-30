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
        "toggle-switch focus-ring flex w-full items-center justify-between gap-4 rounded-2xl p-3 text-left transition",
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
          "toggle-track relative shrink-0 rounded-full border transition",
          checked
            ? "border-[var(--accent)] bg-[var(--accent)] shadow-[var(--accent-glow)]"
            : "border-[var(--border-soft)] bg-[var(--toggle-off)]"
        )}
      >
        <span
          className={cn(
            "toggle-knob absolute rounded-full bg-white shadow-sm transition-transform",
            checked ? "toggle-knob-on" : "toggle-knob-off"
          )}
        />
      </span>
    </button>
  );
}
