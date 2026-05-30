import { nowIso } from "../../utils/dates";
import { hasCompletedGoal } from "../../utils/goals";
import { getLevelFromXP } from "../../utils/levels";
import { calculateDailyGoalMultiplierXP, getWeekKey } from "../../utils/stats";
import { calculateWorkoutTotals } from "../../utils/workoutMetrics";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { Activity, Workout, WorkoutCardioMetric, WorkoutSet } from "../schema";
import { getActiveProfileId } from "./profilesRepo";

const getActivityMap = (activities: Activity[]) =>
  new Map(activities.map((activity) => [activity.id, activity]));

const awardWorkoutXP = (params: {
  activity: Activity;
  sets: WorkoutSet[];
  cardioMetric?: WorkoutCardioMetric;
  previousBest: number;
  dailyTotalBefore: number;
  weeklyTotalBefore: number;
  weeklyBonusAlreadyAwarded: boolean;
}) => {
  const setTotals = calculateWorkoutTotals(params.sets);
  const metricValue =
    params.activity.activityType === "cardio"
      ? (params.cardioMetric?.distanceMeters ?? 0)
      : setTotals.totalValue;
  const baseXP = calculateDailyGoalMultiplierXP({
    unit: params.activity.unit,
    metricValue,
    dailyGoal: params.activity.dailyGoal,
    dailyTotalBefore: params.dailyTotalBefore
  });
  const weeklyBonus =
    !params.weeklyBonusAlreadyAwarded &&
    !hasCompletedGoal(params.weeklyTotalBefore, params.activity.weeklyGoal) &&
    hasCompletedGoal(params.weeklyTotalBefore + metricValue, params.activity.weeklyGoal)
      ? 100
      : 0;
  const personalBestValue =
    params.activity.activityType === "cardio"
      ? (params.cardioMetric?.distanceMeters ?? 0)
      : setTotals.bestSet;
  const personalBestBonus =
    params.previousBest > 0 && personalBestValue > params.previousBest ? 50 : 0;

  return baseXP + weeklyBonus + personalBestBonus;
};

export const getUserProgress = async (database: PenRepsDatabase = db) => {
  const existing = await database.userProgress.get("user");
  if (existing) {
    return existing;
  }

  const progress = {
    id: "user" as const,
    totalXP: 0,
    level: getLevelFromXP(0),
    updatedAt: nowIso()
  };
  await database.userProgress.put(progress);
  return progress;
};

export const recalculateUserProgress = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const activities = await database.activities.toArray();
  const activityMap = getActivityMap(activities);
  const workouts = (await database.workouts.toArray())
    .filter((workout) => !workout.profileId || workout.profileId === profileId)
    .sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime()
    );
  const sets = (await database.workoutSets.toArray()).filter(
    (set) => !set.profileId || set.profileId === profileId
  );
  const cardioMetrics = (await database.workoutCardioMetrics.toArray()).filter(
    (metric) => !metric.profileId || metric.profileId === profileId
  );
  const bestByActivity = new Map<string, number>();
  const dailyTotals = new Map<string, number>();
  const weeklyTotals = new Map<string, number>();
  const weeklyBonusAwarded = new Set<string>();
  let totalXP = 0;
  const updatedWorkouts: Workout[] = [];

  for (const workout of workouts) {
    const activity = activityMap.get(workout.activityId);
    if (!activity) {
      continue;
    }

    const dailyKey = `${workout.activityId}_${workout.localDate}`;
    const weeklyKey = `${workout.activityId}_${getWeekKey(workout.localDate)}`;
    const previousBest = bestByActivity.get(workout.activityId) ?? 0;
    const dailyTotalBefore = dailyTotals.get(dailyKey) ?? 0;
    const weeklyTotalBefore = weeklyTotals.get(weeklyKey) ?? 0;
    const workoutSets = sets.filter((set) => set.workoutId === workout.id);
    const cardioMetric = cardioMetrics.find((metric) => metric.workoutId === workout.id);
    const metricValue =
      activity.activityType === "cardio"
        ? (cardioMetric?.distanceMeters ?? 0)
        : calculateWorkoutTotals(workoutSets).totalValue;
    const xpAwarded = awardWorkoutXP({
      activity,
      sets: workoutSets,
      ...(cardioMetric ? { cardioMetric } : {}),
      previousBest,
      dailyTotalBefore,
      weeklyTotalBefore,
      weeklyBonusAlreadyAwarded: weeklyBonusAwarded.has(weeklyKey)
    });
    const updatedWorkout: Workout = {
      ...workout,
      xpAwarded,
      updatedAt: nowIso()
    };

    totalXP += xpAwarded;
    updatedWorkouts.push(updatedWorkout);
    if (
      !hasCompletedGoal(weeklyTotalBefore, activity.weeklyGoal) &&
      hasCompletedGoal(weeklyTotalBefore + metricValue, activity.weeklyGoal)
    ) {
      weeklyBonusAwarded.add(weeklyKey);
    }
    dailyTotals.set(dailyKey, dailyTotalBefore + metricValue);
    weeklyTotals.set(weeklyKey, weeklyTotalBefore + metricValue);
    bestByActivity.set(
      workout.activityId,
      Math.max(
        previousBest,
        activity.activityType === "cardio"
          ? (cardioMetric?.distanceMeters ?? 0)
          : calculateWorkoutTotals(workoutSets).bestSet
      )
    );
  }

  const progress = {
    id: "user" as const,
    totalXP,
    level: getLevelFromXP(totalXP),
    updatedAt: nowIso()
  };

  await database.transaction("rw", database.workouts, database.userProgress, async () => {
    if (updatedWorkouts.length > 0) {
      await database.workouts.bulkPut(updatedWorkouts);
    }
    await database.userProgress.put(progress);
  });

  return progress;
};
