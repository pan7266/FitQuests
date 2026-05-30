import { endOfWeek, format, getMonth, parseISO, startOfWeek } from "date-fns";
import type {
  Activity,
  DailyActivitySummary,
  Workout,
  WorkoutCardioMetric,
  WorkoutSet
} from "../db/schema";
import {
  type DateRange,
  getLocalDatesBetween,
  getMonthLabelsBetween,
  getPeriodRange,
  isLocalDateInRange,
  maxLocalDate,
  minLocalDate,
  parseLocalDate,
  type StatsPeriod,
  toLocalDate
} from "./dates";
import { getGoalForPeriod, getGoalProgressPercent } from "./goals";
import { getCurrentLevelProgress, type LevelProgress } from "./levels";
import { calculateStreaks, type StreakResult } from "./streaks";
import { getSummaryValueForActivity } from "./workoutMetrics";

export { calculateWorkoutTotals } from "./workoutMetrics";

export interface AllActivityTotals {
  strengthReps: number;
  timedSeconds: number;
  cardioDistanceMeters: number;
}

export interface StatSummary {
  totalReps: number;
  totalSeconds: number;
  totalDistanceMeters: number;
  totalSets: number;
  totalDurationSeconds: number;
  workoutCount: number;
  bestSet: number;
  bestDistanceMeters: number;
  bestPaceSecondsPerKm: number;
  bestAverageSpeedKmh: number;
  bestDay: {
    localDate: string;
    value: number;
  };
  averagePerWorkout: number;
  averagePerDay: number;
  averageDurationPerWorkout: number;
  currentStreak: number;
  bestStreak: number;
  goalValue: number;
  goalProgressPercent: number;
  levelProgress: LevelProgress;
  allActivityTotals: AllActivityTotals;
}

export interface ChartDatum {
  label: string;
  value: number;
  title?: string;
  subtitle?: string;
}

export interface StatsResult {
  period: StatsPeriod;
  selectedActivityId: string | "all";
  valueLabel: string;
  isMixedActivities: boolean;
  range: DateRange;
  summary: StatSummary;
  chartData: ChartDatum[];
}

export const calculateBaseXP = (unit: Activity["unit"], metricValue: number) => {
  if (unit === "seconds") {
    return Math.floor(metricValue / 10);
  }
  if (unit === "distance") {
    return Math.floor(metricValue / 100);
  }

  return metricValue;
};

const getXPDivisor = (unit: Activity["unit"]) => {
  if (unit === "seconds") {
    return 10;
  }
  if (unit === "distance") {
    return 100;
  }

  return 1;
};

export const calculateDailyGoalMultiplierXP = (params: {
  unit: Activity["unit"];
  metricValue: number;
  dailyGoal: number;
  dailyTotalBefore: number;
}) => {
  const metricValue = Math.max(0, params.metricValue);
  if (metricValue <= 0) {
    return 0;
  }
  if (params.dailyGoal <= 0) {
    return calculateBaseXP(params.unit, metricValue);
  }

  const divisor = getXPDivisor(params.unit);
  const goal = params.dailyGoal;
  const segments = [
    {
      start: 0,
      end: goal,
      multiplier: 1
    },
    {
      start: goal,
      end: goal * 2,
      multiplier: 1.2
    },
    {
      start: goal * 2,
      end: Number.POSITIVE_INFINITY,
      multiplier: 1.5
    }
  ];
  const start = params.dailyTotalBefore;
  const end = params.dailyTotalBefore + metricValue;
  const xp = segments.reduce((total, segment) => {
    const segmentStart = Math.max(start, segment.start);
    const segmentEnd = Math.min(end, segment.end);
    const contribution = Math.max(0, segmentEnd - segmentStart);
    return total + (contribution / divisor) * segment.multiplier;
  }, 0);

  return Math.floor(xp);
};

export const getDailyGoalMultiplierLabel = (percent: number) => {
  if (percent >= 200) {
    return "1.5x XP";
  }
  if (percent >= 100) {
    return "1.2x XP";
  }

  return "1.0x XP";
};

export const getWeekKey = (localDate: string) => {
  const date = parseLocalDate(localDate);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  return `${toLocalDate(start)}_${toLocalDate(end)}`;
};

export const getActivityValueLabel = (activity?: Activity) => {
  if (!activity) {
    return "workouts";
  }

  if (activity.activityType === "cardio") {
    return "km";
  }
  if (activity.activityType === "timed") {
    return "time";
  }

  return "reps";
};

const emptyBestDay = {
  localDate: "",
  value: 0
};

const getSummaryActivity = (summary: DailyActivitySummary, activities: Activity[]) =>
  activities.find((activity) => activity.id === summary.activityId);

const buildAllActivityChart = (
  period: StatsPeriod,
  workouts: Workout[],
  summaries: DailyActivitySummary[],
  range: DateRange
): ChartDatum[] => {
  const filteredWorkouts = workouts.filter((workout) =>
    isLocalDateInRange(workout.localDate, range)
  );

  if (period === "day") {
    return filteredWorkouts.map((workout, index) => ({
      label: `W${index + 1}`,
      title: "Workouts",
      value: 1,
      subtitle: workout.localDate
    }));
  }

  if (period === "week" || period === "month") {
    return getLocalDatesBetween(range.start, range.end).map((localDate) => ({
      label:
        period === "week"
          ? format(parseLocalDate(localDate), "EEE")
          : format(parseLocalDate(localDate), "d"),
      title: "Workouts",
      value: filteredWorkouts.filter((workout) => workout.localDate === localDate).length
    }));
  }

  if (period === "year") {
    const values = new Map<number, number>();
    for (const workout of filteredWorkouts) {
      const month = getMonth(parseLocalDate(workout.localDate));
      values.set(month, (values.get(month) ?? 0) + 1);
    }

    return Array.from({ length: 12 }, (_, month) => ({
      label: format(new Date(new Date().getFullYear(), month, 1), "MMM"),
      title: "Workouts",
      value: values.get(month) ?? 0
    }));
  }

  const historyDates = summaries.map((summary) => summary.localDate);
  if (historyDates.length === 0) {
    return [];
  }

  return getMonthLabelsBetween(minLocalDate(historyDates), maxLocalDate(historyDates)).map(
    (month) => ({
      label: format(parseISO(`${month}-01T00:00:00`), "MMM yyyy"),
      title: "Workouts",
      value: workouts.filter((workout) => workout.localDate.startsWith(month)).length
    })
  );
};

const buildDailyChart = (
  workouts: Workout[],
  sets: WorkoutSet[],
  cardioMetrics: WorkoutCardioMetric[],
  selectedActivityId: string,
  range: DateRange,
  selectedActivity: Activity
): ChartDatum[] => {
  if (selectedActivity.activityType === "cardio") {
    return cardioMetrics
      .filter(
        (metric) =>
          metric.activityId === selectedActivityId && isLocalDateInRange(metric.localDate, range)
      )
      .map((metric, index) => ({
        label: `Session ${index + 1}`,
        title: selectedActivity.name,
        value: metric.distanceMeters / 1000,
        subtitle: metric.localDate
      }));
  }

  const dayWorkouts = workouts.filter(
    (workout) =>
      workout.activityId === selectedActivityId && isLocalDateInRange(workout.localDate, range)
  );

  return dayWorkouts.map((workout, index) => ({
    label: `W${index + 1}`,
    title: selectedActivity.name,
    value: sets
      .filter((set) => set.workoutId === workout.id)
      .reduce((total, set) => total + set.value, 0),
    subtitle: workout.startedAt
  }));
};

const buildPeriodChart = (
  period: StatsPeriod,
  summaries: DailyActivitySummary[],
  selectedActivityId: string,
  range: DateRange,
  selectedActivity: Activity
): ChartDatum[] => {
  const filteredSummaries = summaries.filter(
    (summary) =>
      summary.activityId === selectedActivityId && isLocalDateInRange(summary.localDate, range)
  );

  if (period === "week" || period === "month") {
    return getLocalDatesBetween(range.start, range.end).map((localDate) => ({
      label:
        period === "week"
          ? format(parseLocalDate(localDate), "EEE")
          : format(parseLocalDate(localDate), "d"),
      title: selectedActivity.name,
      value: filteredSummaries
        .filter((summary) => summary.localDate === localDate)
        .reduce(
          (total, summary) =>
            total +
            (selectedActivity.activityType === "cardio"
              ? getSummaryValueForActivity(summary, selectedActivity) / 1000
              : getSummaryValueForActivity(summary, selectedActivity)),
          0
        )
    }));
  }

  if (period === "year") {
    const values = new Map<number, number>();
    for (const summary of filteredSummaries) {
      const month = getMonth(parseLocalDate(summary.localDate));
      values.set(
        month,
        (values.get(month) ?? 0) +
          (selectedActivity.activityType === "cardio"
            ? getSummaryValueForActivity(summary, selectedActivity) / 1000
            : getSummaryValueForActivity(summary, selectedActivity))
      );
    }

    return Array.from({ length: 12 }, (_, month) => ({
      label: format(new Date(new Date().getFullYear(), month, 1), "MMM"),
      title: selectedActivity.name,
      value: values.get(month) ?? 0
    }));
  }

  const historyDates = filteredSummaries.map((summary) => summary.localDate);
  if (historyDates.length === 0) {
    return [];
  }

  return getMonthLabelsBetween(minLocalDate(historyDates), maxLocalDate(historyDates)).map(
    (month) => ({
      label: format(parseISO(`${month}-01T00:00:00`), "MMM yyyy"),
      title: selectedActivity.name,
      value: filteredSummaries
        .filter((summary) => summary.localDate.startsWith(month))
        .reduce(
          (total, summary) =>
            total +
            (selectedActivity.activityType === "cardio"
              ? getSummaryValueForActivity(summary, selectedActivity) / 1000
              : getSummaryValueForActivity(summary, selectedActivity)),
          0
        )
    })
  );
};

export const buildStatsResult = (params: {
  period: StatsPeriod;
  selectedActivityId: string | "all";
  activities: Activity[];
  workouts: Workout[];
  sets: WorkoutSet[];
  cardioMetrics?: WorkoutCardioMetric[];
  summaries: DailyActivitySummary[];
  totalXP: number;
  anchorDate?: Date;
}): StatsResult => {
  const anchor = params.anchorDate ?? new Date();
  const range = getPeriodRange(params.period, anchor);
  const selectedActivity =
    params.selectedActivityId === "all"
      ? undefined
      : params.activities.find((activity) => activity.id === params.selectedActivityId);
  const cardioMetrics = params.cardioMetrics ?? [];
  const periodSummaries = params.summaries.filter((summary) => {
    const matchesActivity =
      params.selectedActivityId === "all" || summary.activityId === params.selectedActivityId;
    return matchesActivity && isLocalDateInRange(summary.localDate, range);
  });
  const allActivityTotals = periodSummaries.reduce<AllActivityTotals>(
    (totals, summary) => ({
      strengthReps: totals.strengthReps + (summary.totalReps ?? 0),
      timedSeconds: totals.timedSeconds + (summary.totalSeconds ?? 0),
      cardioDistanceMeters: totals.cardioDistanceMeters + (summary.totalDistanceMeters ?? 0)
    }),
    { strengthReps: 0, timedSeconds: 0, cardioDistanceMeters: 0 }
  );
  const totalReps = periodSummaries.reduce((total, summary) => total + (summary.totalReps ?? 0), 0);
  const totalSeconds = periodSummaries.reduce(
    (total, summary) => total + (summary.totalSeconds ?? 0),
    0
  );
  const totalDistanceMeters = periodSummaries.reduce(
    (total, summary) => total + (summary.totalDistanceMeters ?? 0),
    0
  );
  const totalSets = periodSummaries.reduce((total, summary) => total + (summary.totalSets ?? 0), 0);
  const totalDurationSeconds = periodSummaries.reduce(
    (total, summary) => total + summary.totalDurationSeconds,
    0
  );
  const workoutCount = periodSummaries.reduce((total, summary) => total + summary.workoutCount, 0);
  const bestSet = periodSummaries.reduce(
    (best, summary) => Math.max(best, summary.bestSet ?? 0),
    0
  );
  const bestDistanceMeters = periodSummaries.reduce(
    (best, summary) => Math.max(best, summary.bestDistanceMeters ?? 0),
    0
  );
  const paceValues = periodSummaries
    .map((summary) => summary.bestPaceSecondsPerKm)
    .filter((value): value is number => value !== undefined && value > 0);
  const speedValues = periodSummaries
    .map((summary) => summary.bestAverageSpeedKmh)
    .filter((value): value is number => value !== undefined && value > 0);
  const activeDays = new Set(periodSummaries.map((summary) => summary.localDate)).size;
  const bestDay = periodSummaries.reduce((best, summary) => {
    const activity = getSummaryActivity(summary, params.activities);
    const value = getSummaryValueForActivity(summary, activity);
    return value > best.value ? { localDate: summary.localDate, value } : best;
  }, emptyBestDay);
  const allStreakDates = params.workouts
    .filter(
      (workout) =>
        params.selectedActivityId === "all" || workout.activityId === params.selectedActivityId
    )
    .map((workout) => workout.localDate);
  const streak: StreakResult = calculateStreaks(allStreakDates, anchor);
  const goalValue =
    selectedActivity && params.period !== "all"
      ? getGoalForPeriod(
          selectedActivity,
          params.period === "day"
            ? "daily"
            : params.period === "week"
              ? "weekly"
              : params.period === "month"
                ? "monthly"
                : "yearly"
        )
      : 0;
  const primaryValue = selectedActivity
    ? selectedActivity.activityType === "cardio"
      ? totalDistanceMeters
      : selectedActivity.activityType === "timed"
        ? totalSeconds
        : totalReps
    : workoutCount;
  const chartData =
    params.selectedActivityId === "all" || !selectedActivity
      ? buildAllActivityChart(params.period, params.workouts, params.summaries, range)
      : params.period === "day"
        ? buildDailyChart(
            params.workouts,
            params.sets,
            cardioMetrics,
            params.selectedActivityId,
            range,
            selectedActivity
          )
        : buildPeriodChart(
            params.period,
            params.summaries,
            params.selectedActivityId,
            range,
            selectedActivity
          );

  return {
    period: params.period,
    selectedActivityId: params.selectedActivityId,
    valueLabel: getActivityValueLabel(selectedActivity),
    isMixedActivities: params.selectedActivityId === "all",
    range,
    summary: {
      totalReps,
      totalSeconds,
      totalDistanceMeters,
      totalSets,
      totalDurationSeconds,
      workoutCount,
      bestSet,
      bestDistanceMeters,
      bestPaceSecondsPerKm: paceValues.length > 0 ? Math.min(...paceValues) : 0,
      bestAverageSpeedKmh: speedValues.length > 0 ? Math.max(...speedValues) : 0,
      bestDay,
      averagePerWorkout: workoutCount === 0 ? 0 : primaryValue / workoutCount,
      averagePerDay: activeDays === 0 ? 0 : primaryValue / activeDays,
      averageDurationPerWorkout: workoutCount === 0 ? 0 : totalDurationSeconds / workoutCount,
      currentStreak: streak.current,
      bestStreak: streak.best,
      goalValue,
      goalProgressPercent: getGoalProgressPercent(primaryValue, goalValue),
      levelProgress: getCurrentLevelProgress(params.totalXP),
      allActivityTotals
    },
    chartData
  };
};
