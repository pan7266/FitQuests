import { nowIso } from "../../utils/dates";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type {
  Activity,
  DailyActivitySummary,
  Workout,
  WorkoutCardioMetric,
  WorkoutSet
} from "../schema";
import { getActiveProfileId } from "./profilesRepo";

export const getDailySummaryId = (localDate: string, activityId: string) =>
  `${localDate}_${activityId}`;

const buildSummary = (
  profileId: string,
  localDate: string,
  activityId: string,
  workouts: Workout[],
  sets: WorkoutSet[],
  cardioMetrics: WorkoutCardioMetric[],
  activity: Activity
): DailyActivitySummary => {
  const matchingWorkouts = workouts.filter(
    (workout) => workout.localDate === localDate && workout.activityId === activityId
  );
  const matchingSets = sets.filter(
    (set) => set.localDate === localDate && set.activityId === activityId
  );
  const matchingCardioMetrics = cardioMetrics.filter(
    (metric) => metric.localDate === localDate && metric.activityId === activityId
  );
  const base = {
    id: getDailySummaryId(localDate, activityId),
    profileId,
    localDate,
    activityId,
    activityType: activity.activityType,
    totalDurationSeconds:
      activity.activityType === "cardio"
        ? matchingCardioMetrics.reduce((total, metric) => total + metric.durationSeconds, 0)
        : matchingWorkouts.reduce((total, workout) => total + workout.durationSeconds, 0),
    workoutCount: matchingWorkouts.length,
    updatedAt: nowIso()
  };

  if (activity.activityType === "cardio") {
    const paceValues = matchingCardioMetrics
      .map((metric) => metric.paceSecondsPerKm)
      .filter((value): value is number => value !== undefined && value > 0);
    const speedValues = matchingCardioMetrics
      .map((metric) => metric.averageSpeedKmh)
      .filter((value): value is number => value !== undefined && value > 0);

    return {
      ...base,
      totalDistanceMeters: matchingCardioMetrics.reduce(
        (total, metric) => total + metric.distanceMeters,
        0
      ),
      bestDistanceMeters: matchingCardioMetrics.reduce(
        (best, metric) => Math.max(best, metric.distanceMeters),
        0
      ),
      ...(paceValues.length > 0 ? { bestPaceSecondsPerKm: Math.min(...paceValues) } : {}),
      ...(speedValues.length > 0 ? { bestAverageSpeedKmh: Math.max(...speedValues) } : {})
    };
  }

  if (activity.activityType === "timed") {
    return {
      ...base,
      totalSeconds: matchingSets.reduce((total, set) => total + set.value, 0),
      totalSets: matchingSets.length,
      bestSet: matchingSets.reduce((best, set) => Math.max(best, set.value), 0)
    };
  }

  return {
    ...base,
    totalReps: matchingSets.reduce((total, set) => total + set.value, 0),
    totalSets: matchingSets.length,
    bestSet: matchingSets.reduce((best, set) => Math.max(best, set.value), 0)
  };
};

export const recalculateDailySummaries = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const workouts = (await database.workouts.toArray()).filter(
    (workout) => !workout.profileId || workout.profileId === profileId
  );
  const sets = (await database.workoutSets.toArray()).filter(
    (set) => !set.profileId || set.profileId === profileId
  );
  const activities = await database.activities.toArray();
  const cardioMetrics = (await database.workoutCardioMetrics.toArray()).filter(
    (metric) => !metric.profileId || metric.profileId === profileId
  );
  const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
  const keys = new Set(
    workouts.map((workout) => getDailySummaryId(workout.localDate, workout.activityId))
  );
  const summaries = Array.from(keys).map((key) => {
    const [localDate, ...activityParts] = key.split("_");
    const activityId = activityParts.join("_");

    if (!localDate || !activityId) {
      throw new Error("Invalid summary key.");
    }

    const activity = activityMap.get(activityId);

    if (!activity) {
      throw new Error("Activity not found for summary.");
    }

    return buildSummary(profileId, localDate, activityId, workouts, sets, cardioMetrics, activity);
  });

  await database.transaction("rw", database.dailySummaries, async () => {
    await database.dailySummaries.clear();
    if (summaries.length > 0) {
      await database.dailySummaries.bulkPut(summaries);
    }
  });

  return summaries;
};

export const listSummaries = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const summaries = await database.dailySummaries.toArray();
  return summaries.filter((summary) => !summary.profileId || summary.profileId === profileId);
};

export const listSummariesForRange = async (
  start: string,
  end: string,
  activityId?: string,
  database: PenRepsDatabase = db
) => {
  const profileId = await getActiveProfileId(database);
  const summaries = (
    await database.dailySummaries.where("localDate").between(start, end, true, true).toArray()
  ).filter((summary) => !summary.profileId || summary.profileId === profileId);

  if (!activityId) {
    return summaries;
  }

  return summaries.filter((summary) => summary.activityId === activityId);
};
