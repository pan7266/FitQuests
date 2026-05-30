import { createId } from "../../utils/ids";
import { calculateWorkoutTotals } from "../../utils/workoutMetrics";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { Activity, TrainLog, Workout, WorkoutCardioMetric, WorkoutSet } from "../schema";
import { getActiveProfileId } from "./profilesRepo";

export const createTrainLogForWorkout = async (
  params: {
    profileId: string;
    activity: Activity;
    workout: Workout;
    sets: WorkoutSet[];
    cardioMetric?: WorkoutCardioMetric;
  },
  database: PenRepsDatabase = db
) => {
  const totals = calculateWorkoutTotals(params.sets);
  const log: TrainLog = {
    id: createId(),
    profileId: params.profileId,
    workoutId: params.workout.id,
    exerciseId: params.activity.id,
    exerciseName: params.activity.name,
    trackingType: params.activity.unit,
    xpAwarded: params.workout.xpAwarded,
    createdAt: params.workout.createdAt,
    updatedAt: params.workout.updatedAt
  };

  if (params.activity.activityType === "cardio") {
    log.distanceMeters = params.cardioMetric?.distanceMeters ?? 0;
    log.durationSeconds = params.cardioMetric?.durationSeconds ?? params.workout.durationSeconds;
  } else if (params.activity.unit === "seconds") {
    log.durationSeconds = totals.totalValue;
  } else {
    log.reps = totals.totalValue;
  }

  const maxWeight = params.sets.reduce((best, set) => Math.max(best, set.weightKg ?? 0), 0);
  if (maxWeight > 0) {
    log.weightKg = maxWeight;
  }
  if (params.workout.notes?.trim()) {
    log.notes = params.workout.notes.trim();
  }

  await database.trainLogs.where("workoutId").equals(params.workout.id).delete();
  await database.trainLogs.put(log);
  return log;
};

export const listTrainLogs = async (profileId?: string, database: PenRepsDatabase = db) => {
  const activeProfileId = profileId ?? (await getActiveProfileId(database));
  const logs = await database.trainLogs.where("profileId").equals(activeProfileId).toArray();
  return logs.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};
