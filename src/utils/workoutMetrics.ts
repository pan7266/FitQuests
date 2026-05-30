import type {
  Activity,
  DailyActivitySummary,
  PerceivedEffort,
  WorkoutCardioMetric,
  WorkoutSet
} from "../db/schema";

export const isPerceivedEffort = (value: number): value is PerceivedEffort =>
  Number.isInteger(value) && value >= 1 && value <= 10;

export const calculateWorkoutTotals = (sets: Pick<WorkoutSet, "value">[]) => {
  const totalValue = sets.reduce((total, set) => total + set.value, 0);
  const totalSets = sets.length;
  const bestSet = sets.reduce((best, set) => Math.max(best, set.value), 0);

  return { totalValue, totalSets, bestSet };
};

export interface CardioMetricInput {
  distanceMeters?: number | undefined;
  durationSeconds?: number | undefined;
  averageSpeedKmh?: number | undefined;
  inclinePercent?: number | undefined;
  averageHeartRate?: number | undefined;
  maxHeartRate?: number | undefined;
  perceivedEffort?: number | undefined;
}

const finiteNumber = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) ? value : undefined;

const nonNegativeNumber = (value: number | undefined) => {
  const finiteValue = finiteNumber(value);
  return finiteValue === undefined ? undefined : Math.max(0, finiteValue);
};

export const normalizeCardioMetricValues = (input: CardioMetricInput) => {
  const explicitDistance = nonNegativeNumber(input.distanceMeters);
  const explicitDuration = nonNegativeNumber(input.durationSeconds);
  const explicitSpeed = nonNegativeNumber(input.averageSpeedKmh);
  const averageHeartRate = nonNegativeNumber(input.averageHeartRate);
  const maxHeartRate = nonNegativeNumber(input.maxHeartRate);
  const explicitDistanceMeters =
    explicitDistance !== undefined ? Math.round(explicitDistance) : undefined;
  const explicitDurationSeconds =
    explicitDuration !== undefined ? Math.round(explicitDuration) : undefined;

  let distanceMeters = explicitDistanceMeters ?? 0;
  let durationSeconds = explicitDurationSeconds ?? 0;

  if (
    distanceMeters <= 0 &&
    explicitSpeed &&
    explicitDurationSeconds &&
    explicitDurationSeconds > 0
  ) {
    distanceMeters = Math.round(explicitSpeed * (explicitDurationSeconds / 3600) * 1000);
  }

  if (
    durationSeconds <= 0 &&
    explicitDistanceMeters &&
    explicitDistanceMeters > 0 &&
    explicitSpeed &&
    explicitSpeed > 0
  ) {
    durationSeconds = Math.round((explicitDistanceMeters / 1000 / explicitSpeed) * 3600);
  }

  const computedAverageSpeedKmh =
    distanceMeters > 0 && durationSeconds > 0
      ? distanceMeters / 1000 / (durationSeconds / 3600)
      : undefined;
  const paceSecondsPerKm =
    distanceMeters > 0 && durationSeconds > 0
      ? durationSeconds / (distanceMeters / 1000)
      : undefined;
  const inclinePercent = nonNegativeNumber(input.inclinePercent);
  const elevationGainMeters =
    inclinePercent !== undefined && distanceMeters > 0
      ? distanceMeters * (inclinePercent / 100)
      : undefined;

  return {
    distanceMeters,
    durationSeconds,
    averageSpeedKmh: computedAverageSpeedKmh ?? explicitSpeed,
    paceSecondsPerKm,
    inclinePercent,
    averageInclinePercent: inclinePercent,
    maxInclinePercent: inclinePercent,
    elevationGainMeters,
    averageHeartRate: averageHeartRate !== undefined ? Math.round(averageHeartRate) : undefined,
    maxHeartRate: maxHeartRate !== undefined ? Math.round(maxHeartRate) : undefined,
    perceivedEffort:
      input.perceivedEffort !== undefined && isPerceivedEffort(input.perceivedEffort)
        ? input.perceivedEffort
        : undefined
  };
};

export const getSummaryValueForActivity = (
  summary: DailyActivitySummary,
  activity?: Pick<Activity, "activityType">
) => {
  const activityType = activity?.activityType ?? summary.activityType;
  if (activityType === "cardio") {
    return summary.totalDistanceMeters ?? 0;
  }
  if (activityType === "timed") {
    return summary.totalSeconds ?? 0;
  }

  return summary.totalReps ?? 0;
};

export const getWorkoutMetricValue = (params: {
  activity: Activity;
  sets: WorkoutSet[];
  cardioMetric?: WorkoutCardioMetric;
}) => {
  if (params.activity.activityType === "cardio") {
    return params.cardioMetric?.distanceMeters ?? 0;
  }

  return calculateWorkoutTotals(params.sets).totalValue;
};
