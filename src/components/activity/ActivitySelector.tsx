import type { Activity } from "../../db/schema";
import { cn } from "../../utils/classNames";

interface ActivitySelectorProps {
  activities: Activity[];
  value: string | "all";
  onChange: (activityId: string | "all") => void;
  includeAll?: boolean;
  label?: string;
}

export function ActivitySelector({
  activities,
  value,
  onChange,
  includeAll = true,
  label = "Activity"
}: ActivitySelectorProps) {
  const unitLabel = (activity: Activity) => {
    if (activity.unit === "distance") {
      return "distance";
    }
    if (activity.unit === "seconds") {
      return "seconds";
    }
    return "reps";
  };

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#CBD5E1]">{label}</span>
      <select
        className={cn(
          "focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]",
          "disabled:opacity-50"
        )}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {includeAll ? <option value="all">All Activities</option> : null}
        {activities.map((activity) => (
          <option key={activity.id} value={activity.id}>
            {activity.name} ({unitLabel(activity)})
          </option>
        ))}
      </select>
    </label>
  );
}
