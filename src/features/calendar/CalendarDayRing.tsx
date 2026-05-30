import { cn } from "../../utils/classNames";

interface CalendarDayRingProps {
  label: string;
  value: number;
  valueLabel?: string;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}

export function CalendarDayRing({
  label,
  value,
  valueLabel,
  isCurrentMonth,
  isSelected,
  isToday,
  onClick
}: CalendarDayRingProps) {
  const progress = Math.min(1, value / Math.max(value, 50));
  const background = `conic-gradient(var(--accent) ${progress * 360}deg, rgba(148,163,184,0.12) 0deg)`;

  return (
    <button
      aria-label={`Open ${label}, value ${valueLabel ?? value}`}
      className={cn(
        "focus-ring flex aspect-square min-h-10 items-center justify-center rounded-full p-[2px] transition",
        isSelected && "ring-2 ring-[var(--accent)]",
        !isCurrentMonth && "opacity-35",
        isToday && "text-[#F8FAFC]"
      )}
      onClick={onClick}
      style={{ background }}
      type="button"
    >
      <span className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0B1220]">
        <span className="text-xs font-bold">{label}</span>
        <span className="text-[0.58rem] text-[#94A3B8]">
          {value > 0 ? (valueLabel ?? value) : ""}
        </span>
      </span>
    </button>
  );
}
