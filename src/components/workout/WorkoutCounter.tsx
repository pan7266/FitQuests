import { RotateCcw } from "lucide-react";
import { cn } from "../../utils/classNames";

interface WorkoutCounterProps {
  value: number;
  label: string;
  onTap: () => void;
  onUndo: () => void;
  disabled?: boolean;
  pulseKey?: number;
}

export function WorkoutCounter({
  value,
  label,
  onTap,
  onUndo,
  disabled = false,
  pulseKey = 0
}: WorkoutCounterProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        aria-label={label}
        className={cn(
          "focus-ring tap-feedback app-inset flex h-64 w-64 flex-col items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_42%,transparent)] transition active:scale-[0.985]",
          pulseKey > 0 && "pulse-glow"
        )}
        disabled={disabled}
        key={pulseKey}
        onClick={onTap}
        type="button"
      >
        <span className="text-app text-6xl font-black">{value}</span>
        <span className="text-app-muted mt-2 text-sm font-bold uppercase tracking-[0.18em]">
          tap
        </span>
      </button>
      <button
        className="focus-ring text-app inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold hover:bg-[var(--hover-soft)]"
        disabled={disabled}
        onClick={onUndo}
        type="button"
      >
        <RotateCcw aria-hidden="true" size={18} />
        Undo
      </button>
    </div>
  );
}
