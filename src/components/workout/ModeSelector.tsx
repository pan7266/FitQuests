import { Check, ListPlus, MousePointerClick, Timer } from "lucide-react";
import type { Activity, WorkoutMode } from "../../db/schema";
import { cn } from "../../utils/classNames";
import { TileButton } from "../controls/Button";

interface ModeSelectorProps {
  activity?: Activity | undefined;
  value: WorkoutMode;
  onChange: (mode: WorkoutMode) => void;
}

export function ModeSelector({ activity, value, onChange }: ModeSelectorProps) {
  const options = [
    {
      value: "live" as const,
      title: "Live Counter",
      description: "Tap one large counter for every rep.",
      support: "reps" as const,
      icon: MousePointerClick
    },
    {
      value: "setEntry" as const,
      title: "Log Sets",
      description: "Enter completed reps one set at a time.",
      support: "reps" as const,
      icon: ListPlus
    },
    {
      value: "timed" as const,
      title: "Timed",
      description: "Start, stop, or manually enter seconds.",
      support: "seconds" as const,
      icon: Timer
    },
    {
      value: "cardio" as const,
      title: "Cardio",
      description: "Track distance, duration, pace, speed, and incline.",
      support: "distance" as const,
      icon: Timer
    }
  ].filter((option) => !activity || option.support === activity.unit);

  return (
    <fieldset>
      <legend className="text-app mb-3 block text-sm font-semibold">Mode</legend>
      <div className="mode-tile-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <ModeTile
            key={option.value}
            mode={option.value}
            onChange={onChange}
            selected={value === option.value}
            support={option.support}
            title={option.title}
            description={option.description}
            icon={option.icon}
          />
        ))}
      </div>
    </fieldset>
  );
}

function ModeTile({
  mode,
  selected,
  onChange,
  title,
  description,
  support,
  icon: Icon
}: {
  mode: WorkoutMode;
  selected: boolean;
  onChange: (mode: WorkoutMode) => void;
  title: string;
  description: string;
  support: Activity["unit"];
  icon: typeof Timer;
}) {
  return (
    <TileButton
      aria-pressed={selected}
      className={cn("mode-tile min-h-32 rounded-[1.5rem] p-4", selected && "accent-selected")}
      onClick={() => onChange(mode)}
      selected={selected}
    >
      {selected ? (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
          <Check aria-hidden="true" size={16} />
        </span>
      ) : null}
      <span className="mode-tile-icon mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
        <Icon aria-hidden="true" size={21} />
      </span>
      <span className="text-app block pr-7 font-black">{title}</span>
      <span className="tile-description text-app-soft mt-1 block text-sm leading-5">
        {description}
      </span>
      <span className="tile-support app-pill mt-3 inline-flex">Supports {support}</span>
    </TileButton>
  );
}
