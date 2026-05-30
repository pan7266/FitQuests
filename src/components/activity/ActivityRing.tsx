import type { Activity } from "../../db/schema";
import { ProgressRing } from "./ProgressRing";

interface ActivityRingProps {
  activity: Activity;
  value: number;
  goal: number;
}

export function ActivityRing({ activity, value, goal }: ActivityRingProps) {
  return (
    <ProgressRing
      color={activity.color}
      label={`${activity.name} daily progress ${value} of ${goal || "no goal"}`}
      max={goal || Math.max(value, 1)}
      size={74}
      stroke={8}
      value={value}
    >
      <span className="text-sm font-bold text-[#F8FAFC]">{value}</span>
    </ProgressRing>
  );
}
