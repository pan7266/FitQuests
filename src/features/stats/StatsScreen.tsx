import { useEffect, useMemo, useState } from "react";
import { ActivitySelector } from "../../components/activity/ActivitySelector";
import { SegmentedControl } from "../../components/activity/SegmentedControl";
import { StatsChart } from "../../components/charts/StatsChart";
import { EmptyState } from "../../components/feedback/EmptyState";
import { NeomorphicCard } from "../../components/neumorphic/NeomorphicCard";
import { listActivities } from "../../db/repositories/activitiesRepo";
import { getUserProgress } from "../../db/repositories/progressRepo";
import { listSummaries } from "../../db/repositories/summariesRepo";
import {
  listWorkoutCardioMetrics,
  listWorkoutSets,
  listWorkouts
} from "../../db/repositories/workoutsRepo";
import type {
  Activity,
  DailyActivitySummary,
  UserProgress,
  Workout,
  WorkoutCardioMetric,
  WorkoutSet
} from "../../db/schema";
import { useAppStore } from "../../stores/appStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { StatsPeriod } from "../../utils/dates";
import { formatDisplayDate, formatDuration, isLocalDateInRange } from "../../utils/dates";
import { translate } from "../../utils/i18n";
import { buildStatsResult } from "../../utils/stats";

export function StatsScreen() {
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const t = (key: string) => translate(appLanguage, key);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setSelectedActivityId = useAppStore((state) => state.setSelectedActivityId);
  const selectedActivityId = useAppStore((state) => state.selectedActivityId);
  const [period, setPeriod] = useState<StatsPeriod>("day");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [cardioMetrics, setCardioMetrics] = useState<WorkoutCardioMetric[]>([]);
  const [summaries, setSummaries] = useState<DailyActivitySummary[]>([]);
  const [progress, setProgress] = useState<UserProgress>({
    id: "user",
    totalXP: 0,
    level: 1,
    updatedAt: ""
  });
  const periodOptions = [
    { label: "D", value: "day" as const },
    { label: "W", value: "week" as const },
    { label: "M", value: "month" as const },
    { label: "Y", value: "year" as const },
    { label: t("stats.allShort"), value: "all" as const }
  ];

  useEffect(() => {
    const load = async () => {
      const [
        nextActivities,
        nextWorkouts,
        nextSets,
        nextSummaries,
        nextCardioMetrics,
        nextProgress
      ] = await Promise.all([
        listActivities(),
        listWorkouts(),
        listWorkoutSets(),
        listSummaries(),
        listWorkoutCardioMetrics(),
        getUserProgress()
      ]);
      setActivities(nextActivities);
      setWorkouts(nextWorkouts);
      setSets(nextSets);
      setSummaries(nextSummaries);
      setCardioMetrics(nextCardioMetrics);
      setProgress(nextProgress);
    };

    void load();
  }, []);

  const stats = useMemo(
    () =>
      buildStatsResult({
        period,
        selectedActivityId,
        activities,
        workouts,
        sets,
        cardioMetrics,
        summaries,
        totalXP: progress.totalXP
      }),
    [
      period,
      selectedActivityId,
      activities,
      workouts,
      sets,
      cardioMetrics,
      summaries,
      progress.totalXP
    ]
  );
  const selectedActivity =
    selectedActivityId === "all"
      ? undefined
      : activities.find((activity) => activity.id === selectedActivityId);
  const formatStatValue = (value: number | string) => {
    if (typeof value === "number" && selectedActivity?.unit === "distance") {
      return `${(value / 1000).toFixed(2)} km`;
    }
    if (typeof value === "number" && selectedActivity?.unit === "seconds") {
      return formatDuration(value);
    }

    return String(value);
  };
  const primaryTotal =
    selectedActivity?.activityType === "cardio"
      ? stats.summary.totalDistanceMeters
      : selectedActivity?.activityType === "timed"
        ? stats.summary.totalSeconds
        : selectedActivity?.activityType === "strength"
          ? stats.summary.totalReps
          : stats.summary.workoutCount;
  const periodXP = workouts
    .filter((workout) => isLocalDateInRange(workout.localDate, stats.range))
    .reduce((total, workout) => total + workout.xpAwarded, 0);
  const recentWorkoutDescription = (workout: Workout, activity?: Activity) => {
    if (!activity) {
      return t("common.workout");
    }
    if (activity.activityType === "cardio") {
      const metric = cardioMetrics.find((item) => item.workoutId === workout.id);
      return `${((metric?.distanceMeters ?? 0) / 1000).toFixed(2)} km · ${formatDuration(metric?.durationSeconds ?? workout.durationSeconds)}`;
    }
    const workoutSets = sets.filter((set) => set.workoutId === workout.id);
    const total = workoutSets.reduce((sum, set) => sum + set.value, 0);
    return activity.activityType === "timed"
      ? `${workoutSets.length} ${t("stats.sets").toLowerCase()} · ${formatDuration(total)}`
      : `${workoutSets.length} ${t("stats.sets").toLowerCase()} · ${total} ${t("stats.reps").toLowerCase()}`;
  };
  const periodCardioMetrics =
    selectedActivity?.activityType === "cardio"
      ? cardioMetrics.filter(
          (metric) =>
            metric.activityId === selectedActivity.id &&
            metric.localDate >= stats.range.start &&
            metric.localDate <= stats.range.end
        )
      : [];
  const averageSpeed =
    periodCardioMetrics.reduce((total, metric) => total + metric.distanceMeters, 0) > 0 &&
    periodCardioMetrics.reduce((total, metric) => total + metric.durationSeconds, 0) > 0
      ? periodCardioMetrics.reduce((total, metric) => total + metric.distanceMeters, 0) /
        1000 /
        (periodCardioMetrics.reduce((total, metric) => total + metric.durationSeconds, 0) / 3600)
      : 0;

  if (workouts.length === 0) {
    return (
      <section className="space-y-4 lg:space-y-6">
        <EmptyState
          description={t("stats.emptyDescription")}
          onPrimary={() => setActiveTab("train")}
          onSecondary={() => setActiveTab("settings")}
          primaryLabel={t("common.startWorkout")}
          secondaryLabel={t("common.addActivity")}
          title={t("stats.noWorkoutsYet")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4 lg:space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] xl:grid-cols-[minmax(0,1.55fr)_24rem]">
        <section className="app-card rounded-[1.75rem] p-4 lg:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(16rem,1fr)_minmax(18rem,1fr)] lg:grid-cols-1 xl:grid-cols-[minmax(18rem,1fr)_minmax(19rem,1fr)]">
            <SegmentedControl
              label={t("stats.period")}
              onChange={setPeriod}
              options={periodOptions}
              value={period}
            />
            <ActivitySelector
              activities={activities}
              onChange={setSelectedActivityId}
              value={selectedActivityId}
            />
          </div>
        </section>
        <NeomorphicCard className="hidden lg:block">
          <p className="text-app-muted text-sm font-bold">
            {selectedActivity?.activityType === "cardio"
              ? t("stats.totalDistance")
              : selectedActivity
                ? t("profile.total")
                : t("progress.workoutCount")}
          </p>
          <h2 className="text-app mt-1 text-5xl font-black">{formatStatValue(primaryTotal)}</h2>
          <p className="text-app-soft mt-2 text-sm">
            {stats.summary.workoutCount} {t("stats.workoutsInThisView")}
          </p>
        </NeomorphicCard>
      </div>
      {stats.isMixedActivities ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric
            label={t("stats.strengthReps")}
            value={stats.summary.allActivityTotals.strengthReps}
          />
          <Metric
            label={t("stats.timedDuration")}
            value={formatDuration(stats.summary.allActivityTotals.timedSeconds)}
          />
          <Metric
            label={t("stats.cardioDistance")}
            value={`${(stats.summary.allActivityTotals.cardioDistanceMeters / 1000).toFixed(2)} km`}
          />
          <Metric label={t("progress.workoutCount")} value={stats.summary.workoutCount} />
          <Metric label="XP" value={periodXP} />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <NeomorphicCard className="lg:min-h-[26rem]">
          <h2 className="text-app mb-3 text-lg font-black">{t("stats.chart")}</h2>
          <div className="lg:h-80">
            <StatsChart data={stats.chartData} valueLabel={stats.valueLabel} />
          </div>
        </NeomorphicCard>
        <aside className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Metric label={t("profile.currentStreak")} value={`${stats.summary.currentStreak}d`} />
          <Metric label={t("profile.bestStreak")} value={`${stats.summary.bestStreak}d`} />
          {stats.isMixedActivities ? (
            <>
              <Metric label={t("progress.workoutCount")} value={stats.summary.workoutCount} />
              <Metric
                label={t("stats.avgWorkoutsDay")}
                value={stats.summary.averagePerDay.toFixed(1)}
              />
            </>
          ) : (
            <>
              {selectedActivity?.activityType === "cardio" ? (
                <Metric
                  label={t("stats.bestDistance")}
                  value={formatStatValue(stats.summary.bestDistanceMeters)}
                />
              ) : (
                <Metric
                  label={t("records.bestSet")}
                  value={formatStatValue(stats.summary.bestSet)}
                />
              )}
              <Metric
                label={t("records.bestDay")}
                value={formatStatValue(stats.summary.bestDay.value)}
                detail={
                  stats.summary.bestDay.localDate
                    ? formatDisplayDate(stats.summary.bestDay.localDate)
                    : t("common.none")
                }
              />
              <Metric
                label={t("stats.avgWorkout")}
                value={formatStatValue(stats.summary.averagePerWorkout)}
              />
              {selectedActivity?.activityType === "cardio" ? (
                <>
                  <Metric
                    label={t("stats.avgDuration")}
                    value={formatDuration(stats.summary.averageDurationPerWorkout)}
                  />
                  <Metric
                    label={t("stats.bestPace")}
                    value={
                      stats.summary.bestPaceSecondsPerKm > 0
                        ? `${formatDuration(stats.summary.bestPaceSecondsPerKm)}/km`
                        : "--"
                    }
                  />
                  <Metric
                    label={t("stats.bestSpeed")}
                    value={
                      stats.summary.bestAverageSpeedKmh > 0
                        ? `${stats.summary.bestAverageSpeedKmh.toFixed(1)} km/h`
                        : "--"
                    }
                  />
                  <Metric
                    label={t("stats.avgSpeed")}
                    value={averageSpeed > 0 ? `${averageSpeed.toFixed(1)} km/h` : "--"}
                  />
                </>
              ) : (
                <Metric
                  label={t("stats.avgDay")}
                  value={formatStatValue(stats.summary.averagePerDay)}
                />
              )}
            </>
          )}
        </aside>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isMixedActivities ? (
          <Metric label="XP" value={periodXP} />
        ) : selectedActivity?.activityType === "cardio" ? (
          <Metric
            label={t("stats.duration")}
            value={formatDuration(stats.summary.totalDurationSeconds)}
          />
        ) : (
          <Metric label={t("stats.sets")} value={stats.summary.totalSets} />
        )}
        <Metric label={t("progress.workouts")} value={stats.summary.workoutCount} />
        <Metric label={t("profile.level")} value={stats.summary.levelProgress.level} />
        <Metric
          label={t("stats.xpProgress")}
          value={`${stats.summary.levelProgress.xpIntoLevel}/${stats.summary.levelProgress.xpForNextLevel}`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]">
        {stats.summary.goalValue > 0 ? (
          <NeomorphicCard>
            <div className="flex justify-between text-sm">
              <span className="text-app font-bold">{t("stats.goalProgress")}</span>
              <span className="text-[#94A3B8]">
                {formatStatValue(primaryTotal)}/{formatStatValue(stats.summary.goalValue)}
              </span>
            </div>
            <div
              aria-label={t("stats.goalProgress")}
              className="app-progress mt-3 h-3 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(stats.summary.goalProgressPercent)}
            >
              <div
                className="h-full rounded-full bg-[var(--success)]"
                style={{ width: `${stats.summary.goalProgressPercent}%` }}
              />
            </div>
          </NeomorphicCard>
        ) : null}
        <NeomorphicCard>
          <h2 className="text-app mb-3 text-lg font-black">{t("stats.recentWorkouts")}</h2>
          <div className="space-y-2">
            {workouts.slice(0, 4).map((workout) => {
              const activity = activities.find((item) => item.id === workout.activityId);
              return (
                <div className="app-inset rounded-2xl px-4 py-3" key={workout.id}>
                  <p className="text-app font-bold">
                    {activity ? translateActivityName(appLanguage, activity) : t("common.workout")}
                  </p>
                  <p className="text-app-muted text-sm">
                    {recentWorkoutDescription(workout, activity)}
                  </p>
                </div>
              );
            })}
          </div>
        </NeomorphicCard>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail
}: {
  label: string;
  value: number | string;
  detail?: string;
}) {
  return (
    <div className="app-card rounded-3xl p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#F8FAFC]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[#94A3B8]">{detail}</p> : null}
    </div>
  );
}

function translateActivityName(language: "en" | "el", activity: Activity) {
  const keyBySlug: Record<string, string> = {
    pullups: "activities.pullups",
    pushups: "activities.pushups",
    situps: "activities.situps",
    squats: "activities.squats",
    treadmill: "activities.treadmill"
  };
  const key = keyBySlug[activity.slug];
  return key ? translate(language, key) : activity.name;
}
