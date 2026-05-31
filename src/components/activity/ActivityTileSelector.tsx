import { Check, Plus } from "lucide-react";
import { getExerciseMedia } from "../../data/exerciseMedia";
import type { Activity, DailyActivitySummary } from "../../db/schema";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../utils/classNames";
import { formatDuration, toLocalDate } from "../../utils/dates";
import { translate } from "../../utils/i18n";
import { TileButton } from "../controls/Button";
import { ActivityIcon } from "./ActivityIcon";

interface ActivityTileSelectorProps {
  activities: Activity[];
  value: string;
  onChange: (activityId: string) => void;
  onStartActivity?: ((activityId: string) => void) | undefined;
  onAddActivity: () => void;
  summaries?: DailyActivitySummary[] | undefined;
  localDate?: string | undefined;
}

export function ActivityTileSelector({
  activities,
  value,
  onChange,
  onStartActivity,
  onAddActivity,
  summaries = [],
  localDate = toLocalDate()
}: ActivityTileSelectorProps) {
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const t = (key: string) => translate(appLanguage, key);
  const sortedActivities = [...activities].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });

  return (
    <fieldset>
      <legend className="text-app mb-3 block text-sm font-semibold">{t("train.activity")}</legend>
      <div className="activity-tile-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {sortedActivities.map((activity) => {
          const isSelected = activity.id === value;
          const directStart = Boolean(onStartActivity);
          const summary = summaries.find(
            (item) => item.activityId === activity.id && item.localDate === localDate
          );
          const todayTotal = getTodayTotal(activity, summary);
          const media = getExerciseMedia(activity.slug);
          const translatedName = translateActivityName(activity, t);
          const content = (
            <>
              {isSelected && !directStart ? (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
                  <Check aria-hidden="true" size={16} />
                </span>
              ) : null}
              <span className="relative mb-3 block aspect-[4/3] overflow-hidden rounded-[1.05rem] bg-[var(--surface-inset)]">
                {media ? (
                  <img
                    alt={t(media.imageAltKey)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={media.imageSrc}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[var(--accent)]">
                    <ActivityIcon activity={activity} size={32} />
                  </span>
                )}
                <span className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-black/48 text-white backdrop-blur-md">
                  <ActivityIcon activity={activity} size={20} />
                </span>
              </span>
              <span className="text-app block text-base font-black leading-tight">
                {translatedName}
              </span>
              <span className="text-app-muted mt-1 block text-xs font-bold uppercase tracking-[0.12em]">
                {translateActivityType(activity.activityType, t)}
              </span>
              <div className="activity-tile-meta mt-3 flex flex-wrap gap-1.5">
                {activity.dailyGoal > 0 ? (
                  <span className="app-pill">{formatGoalLine(activity, todayTotal)}</span>
                ) : (
                  <span className="app-pill">{formatTodayOnly(activity, todayTotal, t)}</span>
                )}
              </div>
            </>
          );

          if (directStart) {
            return (
              <article
                className="train-activity-tile app-card flex min-h-40 flex-col overflow-hidden rounded-[1.5rem] p-3"
                key={activity.id}
              >
                {content}
                <button
                  className="focus-ring mt-auto flex min-h-10 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-3 text-sm font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
                  onClick={() => onStartActivity?.(activity.id)}
                  type="button"
                >
                  {t("common.startWorkout")}
                </button>
              </article>
            );
          }

          return (
            <TileButton
              aria-pressed={isSelected}
              className={cn(
                "train-activity-tile flex min-h-40 flex-col overflow-hidden rounded-[1.5rem] p-3",
                isSelected && !directStart && "accent-selected"
              )}
              key={activity.id}
              onClick={() => {
                if (!directStart) {
                  onChange(activity.id);
                }
              }}
              selected={isSelected && !directStart}
            >
              {content}
            </TileButton>
          );
        })}
        <TileButton
          className="activity-add-tile train-activity-tile flex min-h-32 flex-col items-center justify-center rounded-[1.5rem] border-dashed p-4 text-center"
          onClick={onAddActivity}
        >
          <span className="activity-tile-icon mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
            <Plus aria-hidden="true" size={22} />
          </span>
          <span className="text-app font-black">{t("common.addActivity")}</span>
          <span className="tile-description text-app-soft mt-1 text-sm">
            {t("train.createCustomMovement")}
          </span>
        </TileButton>
      </div>
    </fieldset>
  );
}

function getTodayTotal(activity: Activity, summary?: DailyActivitySummary | undefined) {
  if (activity.activityType === "cardio") {
    return summary?.totalDistanceMeters ?? 0;
  }
  if (activity.activityType === "timed") {
    return summary?.totalSeconds ?? 0;
  }
  if (activity.activityType === "health") {
    return 0;
  }
  return summary?.totalReps ?? 0;
}

function formatActivityAmount(activity: Activity, value: number) {
  if (activity.activityType === "health" || activity.unit === "milliliters") {
    return `${(value / 1000).toFixed(2)} L`;
  }
  if (activity.activityType === "cardio") {
    return `${(value / 1000).toFixed(1)} km`;
  }
  if (activity.activityType === "timed") {
    return formatDuration(value);
  }
  return `${Math.round(value)} reps`;
}

function formatGoalLine(activity: Activity, todayTotal: number) {
  if (activity.activityType === "health" || activity.unit === "milliliters") {
    return `${(todayTotal / 1000).toFixed(2)} / ${(activity.dailyGoal / 1000).toFixed(1)} L`;
  }
  if (activity.activityType === "cardio") {
    return `${(todayTotal / 1000).toFixed(1)} / ${(activity.dailyGoal / 1000).toFixed(1)} km`;
  }
  if (activity.activityType === "timed") {
    return `${formatDuration(todayTotal)} / ${formatDuration(activity.dailyGoal)}`;
  }
  return `${Math.round(todayTotal)} / ${activity.dailyGoal} reps`;
}

function formatTodayOnly(activity: Activity, todayTotal: number, t: (key: string) => string) {
  return todayTotal > 0 ? formatActivityAmount(activity, todayTotal) : t("train.noGoal");
}

function translateActivityType(activityType: Activity["activityType"], t: (key: string) => string) {
  if (activityType === "cardio") {
    return t("train.cardio");
  }
  if (activityType === "strength") {
    return t("train.strength");
  }
  if (activityType === "health") {
    return t("train.health");
  }
  return t("workout.timed");
}

function translateActivityName(activity: Activity, t: (key: string) => string) {
  const keys: Record<string, string> = {
    pullups: "activities.pullups",
    pushups: "activities.pushups",
    situps: "activities.situps",
    squats: "activities.squats",
    treadmill: "activities.treadmill"
  };
  return keys[activity.slug] ? t(keys[activity.slug]) : activity.name;
}
