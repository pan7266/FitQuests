import {
  Activity as ActivityGlyph,
  ArrowDownToLine,
  ArrowUp,
  Dumbbell,
  Footprints,
  Plus,
  Timer,
  Zap
} from "lucide-react";
import type { ComponentType } from "react";
import type { Activity } from "../../db/schema";

const iconMap = {
  Activity: ActivityGlyph,
  ArrowDownToLine,
  ArrowUp,
  Dumbbell,
  Footprints,
  Plus,
  Timer,
  Zap
} satisfies Record<
  string,
  ComponentType<{ size?: number; className?: string; "aria-hidden"?: true }>
>;

export const getActivityIcon = (activity?: Pick<Activity, "icon" | "slug">) => {
  if (!activity) {
    return Dumbbell;
  }
  if (activity.slug === "push-ups") {
    return Dumbbell;
  }
  if (activity.slug === "pull-ups") {
    return ArrowUp;
  }
  if (activity.slug === "sit-ups") {
    return ActivityGlyph;
  }
  if (activity.slug === "squats") {
    return ArrowDownToLine;
  }
  if (activity.slug === "treadmill") {
    return Footprints;
  }
  return iconMap[activity.icon as keyof typeof iconMap] ?? Dumbbell;
};

export function ActivityIcon({
  activity,
  size = 22,
  className
}: {
  activity?: Pick<Activity, "icon" | "slug"> | undefined;
  size?: number;
  className?: string | undefined;
}) {
  const Icon = getActivityIcon(activity);
  return <Icon aria-hidden="true" className={className} size={size} />;
}
