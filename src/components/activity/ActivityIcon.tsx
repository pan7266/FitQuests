import { Dumbbell } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { Activity } from "../../db/schema";

type ActivityIconProps = {
  activity?: Pick<Activity, "icon" | "slug" | "activityType" | "unit"> | undefined;
  size?: number;
  className?: string | undefined;
};

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

const commonProps = {
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round"
} as const;

const PushupIcon: SvgIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" {...props}>
    <path d="M10 42H54" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M18 38L30 30L44 38" stroke="currentColor" strokeWidth="5" {...commonProps} />
    <path d="M28 30L35 42" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <circle cx="16" cy="37" r="4" fill="currentColor" />
    <path d="M30 30L45 32" stroke="#ef4444" strokeWidth="5" {...commonProps} />
  </svg>
);

const PullupIcon: SvgIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" {...props}>
    <path d="M13 12H51" stroke="currentColor" strokeWidth="5" {...commonProps} />
    <circle cx="32" cy="27" r="6" fill="currentColor" />
    <path d="M22 17L28 31M42 17L36 31" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M28 34L24 50M36 34L40 50" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M24 32H40" stroke="#ef4444" strokeWidth="5" {...commonProps} />
  </svg>
);

const SitupIcon: SvgIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" {...props}>
    <path d="M10 47H54" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <circle cx="23" cy="26" r="5" fill="currentColor" />
    <path d="M27 31L38 39L51 36" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M29 35L18 43" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M28 31L38 39" stroke="#ef4444" strokeWidth="5" {...commonProps} />
  </svg>
);

const SquatIcon: SvgIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" {...props}>
    <circle cx="32" cy="16" r="5" fill="currentColor" />
    <path d="M32 22V34L22 44M32 34L44 44" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M18 44H28M38 44H50" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M22 44L32 34L44 44" stroke="#ef4444" strokeWidth="5" {...commonProps} />
  </svg>
);

const TreadmillIcon: SvgIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" {...props}>
    <path d="M12 48H50C55 48 58 45 58 40" stroke="currentColor" strokeWidth="5" {...commonProps} />
    <path d="M18 40L31 22L43 31" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <circle cx="31" cy="17" r="5" fill="currentColor" />
    <path d="M26 29L38 35" stroke="#ef4444" strokeWidth="5" {...commonProps} />
    <path d="M45 18H55V40" stroke="currentColor" strokeWidth="4" {...commonProps} />
  </svg>
);

const TimedIcon: SvgIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" {...props}>
    <circle cx="32" cy="34" r="19" stroke="currentColor" strokeWidth="4" {...commonProps} />
    <path d="M32 34V22M32 34L41 40" stroke="#ef4444" strokeWidth="5" {...commonProps} />
    <path d="M25 10H39" stroke="currentColor" strokeWidth="4" {...commonProps} />
  </svg>
);

const WeightIcon: SvgIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" {...props}>
    <path d="M14 32H50" stroke="currentColor" strokeWidth="5" {...commonProps} />
    <path
      d="M10 24V40M18 22V42M46 22V42M54 24V40"
      stroke="currentColor"
      strokeWidth="4"
      {...commonProps}
    />
    <path d="M25 32H39" stroke="#ef4444" strokeWidth="6" {...commonProps} />
  </svg>
);

const getExerciseIcon = (
  activity?: Pick<Activity, "icon" | "slug" | "activityType" | "unit">
): SvgIcon | typeof Dumbbell => {
  if (!activity) {
    return Dumbbell;
  }
  if (activity.slug === "pushups" || activity.slug === "push-ups") {
    return PushupIcon;
  }
  if (activity.slug === "pullups" || activity.slug === "pull-ups") {
    return PullupIcon;
  }
  if (activity.slug === "situps" || activity.slug === "sit-ups") {
    return SitupIcon;
  }
  if (activity.slug === "squats") {
    return SquatIcon;
  }
  if (activity.slug === "treadmill" || activity.activityType === "cardio") {
    return TreadmillIcon;
  }
  if (activity.unit === "seconds" || activity.activityType === "timed") {
    return TimedIcon;
  }
  if (activity.unit === "weight") {
    return WeightIcon;
  }
  return Dumbbell;
};

export function ActivityIcon({ activity, size = 22, className }: ActivityIconProps) {
  const Icon = getExerciseIcon(activity);
  return <Icon aria-hidden="true" className={className} height={size} width={size} />;
}
