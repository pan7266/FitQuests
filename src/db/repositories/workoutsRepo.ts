import { nowIso, toLocalDate } from "../../utils/dates";
import { createId } from "../../utils/ids";
import { secondsBetween } from "../../utils/timers";
import { normalizeCardioMetricValues } from "../../utils/workoutMetrics";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type {
  ActiveWorkoutDraft,
  CompletedWorkoutInput,
  Workout,
  WorkoutCardioMetric,
  WorkoutSet
} from "../schema";
import { recalculateAchievements } from "./achievementsRepo";
import { deleteActiveWorkoutDraft } from "./activeWorkoutRepo";
import { applyWorkoutToAdventureTargets, recalculateAdventure } from "./adventureRepo";
import { getActiveProfileId } from "./profilesRepo";
import { recalculateUserProgress } from "./progressRepo";
import { recalculateDailySummaries } from "./summariesRepo";
import { createTrainLogForWorkout } from "./trainLogsRepo";

export interface WorkoutWithSets {
  workout: Workout;
  sets: WorkoutSet[];
  cardioMetric?: WorkoutCardioMetric;
}

export interface CompletedWorkoutResult extends WorkoutWithSets {
  progress: Awaited<ReturnType<typeof recalculateUserProgress>>;
}

export interface CreateCardioWorkoutInput {
  activityId: string;
  startedAt: string;
  endedAt: string;
  localDate: string;
  distanceMeters: number;
  durationSeconds: number;
  averageSpeedKmh?: number;
  inclinePercent?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  perceivedEffort?: number;
  notes?: string;
}

export interface WorkoutWriteOptions {
  source?: "train" | "adventure" | "import";
}

const createWorkoutFromSets = (
  input: CompletedWorkoutInput,
  workoutId: string,
  profileId: string
): Workout => {
  const workout: Workout = {
    id: workoutId,
    profileId,
    activityId: input.activityId,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    localDate: input.localDate,
    durationSeconds: secondsBetween(input.startedAt, input.endedAt),
    mode: input.mode,
    xpAwarded: 0,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  if (input.notes?.trim()) {
    workout.notes = input.notes.trim();
  }

  return workout;
};

export const listWorkouts = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const workouts = await database.workouts.toArray();
  return workouts
    .filter((workout) => !workout.profileId || workout.profileId === profileId)
    .sort(
      (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
    );
};

export const listWorkoutSets = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const sets = await database.workoutSets.toArray();
  return sets
    .filter((set) => !set.profileId || set.profileId === profileId)
    .sort(
      (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime()
    );
};

export const listWorkoutCardioMetrics = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const metrics = await database.workoutCardioMetrics.toArray();
  return metrics.filter((metric) => !metric.profileId || metric.profileId === profileId);
};

export const getWorkoutWithSets = async (
  workoutId: string,
  database: PenRepsDatabase = db
): Promise<WorkoutWithSets | undefined> => {
  const workout = await database.workouts.get(workoutId);

  if (!workout) {
    return undefined;
  }

  const sets = await database.workoutSets.where("workoutId").equals(workoutId).sortBy("setIndex");
  const cardioMetric = await database.workoutCardioMetrics
    .where("workoutId")
    .equals(workoutId)
    .first();

  const result: WorkoutWithSets = { workout, sets };
  if (cardioMetric) {
    result.cardioMetric = cardioMetric;
  }

  return result;
};

export const listWorkoutsForLocalDate = async (
  localDate: string,
  database: PenRepsDatabase = db
) => {
  const profileId = await getActiveProfileId(database);
  const workouts = (await database.workouts.where("localDate").equals(localDate).toArray()).filter(
    (workout) => !workout.profileId || workout.profileId === profileId
  );
  return workouts.sort(
    (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime()
  );
};

export const createCompletedWorkout = async (
  input: CompletedWorkoutInput,
  database: PenRepsDatabase = db,
  options: WorkoutWriteOptions = {}
): Promise<CompletedWorkoutResult> => {
  const profileId = await getActiveProfileId(database);
  const workoutId = createId();
  const workout = createWorkoutFromSets(input, workoutId, profileId);
  const sets: WorkoutSet[] = input.sets.map((set, index) => {
    const workoutSet: WorkoutSet = {
      ...set,
      id: set.id || createId(),
      profileId,
      workoutId,
      activityId: input.activityId,
      setIndex: index + 1,
      localDate: input.localDate
    };

    return workoutSet;
  });

  await database.transaction("rw", database.workouts, database.workoutSets, async () => {
    await database.workouts.add(workout);
    if (sets.length > 0) {
      await database.workoutSets.bulkAdd(sets);
    }
  });

  await recalculateDailySummaries(database);
  const progress = await recalculateUserProgress(database);
  await recalculateAchievements(database);
  await applyWorkoutToAdventureTargets(workoutId, database);
  await recalculateAdventure(database);

  const saved = await database.workouts.get(workoutId);
  if (!saved) {
    throw new Error("Workout save failed.");
  }
  if ((options.source ?? "train") === "train") {
    const activity = await database.activities.get(saved.activityId);
    if (activity) {
      await createTrainLogForWorkout({ profileId, activity, workout: saved, sets }, database);
    }
  }

  return { workout: saved, sets, progress };
};

export const createCardioWorkout = async (
  input: CreateCardioWorkoutInput,
  database: PenRepsDatabase = db,
  options: WorkoutWriteOptions = {}
): Promise<CompletedWorkoutResult> => {
  const profileId = await getActiveProfileId(database);
  const workoutId = createId();
  const timestamp = nowIso();
  const metricValues = normalizeCardioMetricValues(input);
  const workout: Workout = {
    id: workoutId,
    profileId,
    activityId: input.activityId,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    localDate: input.localDate,
    durationSeconds: metricValues.durationSeconds,
    mode: "cardio",
    xpAwarded: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  if (input.notes?.trim()) {
    workout.notes = input.notes.trim();
  }
  const metric: WorkoutCardioMetric = {
    id: createId(),
    profileId,
    workoutId,
    activityId: input.activityId,
    localDate: input.localDate,
    distanceMeters: metricValues.distanceMeters,
    durationSeconds: metricValues.durationSeconds,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  if (metricValues.averageSpeedKmh !== undefined && Number.isFinite(metricValues.averageSpeedKmh)) {
    metric.averageSpeedKmh = metricValues.averageSpeedKmh;
  }
  if (
    metricValues.paceSecondsPerKm !== undefined &&
    Number.isFinite(metricValues.paceSecondsPerKm)
  ) {
    metric.paceSecondsPerKm = metricValues.paceSecondsPerKm;
  }
  if (metricValues.inclinePercent !== undefined && Number.isFinite(metricValues.inclinePercent)) {
    metric.inclinePercent = metricValues.inclinePercent;
    metric.averageInclinePercent = metricValues.inclinePercent;
    metric.maxInclinePercent = metricValues.inclinePercent;
  }
  if (
    metricValues.elevationGainMeters !== undefined &&
    Number.isFinite(metricValues.elevationGainMeters)
  ) {
    metric.elevationGainMeters = metricValues.elevationGainMeters;
  }
  if (
    metricValues.averageHeartRate !== undefined &&
    Number.isFinite(metricValues.averageHeartRate)
  ) {
    metric.averageHeartRate = metricValues.averageHeartRate;
  }
  if (metricValues.maxHeartRate !== undefined && Number.isFinite(metricValues.maxHeartRate)) {
    metric.maxHeartRate = metricValues.maxHeartRate;
  }
  if (metricValues.perceivedEffort !== undefined) {
    metric.perceivedEffort = metricValues.perceivedEffort;
  }

  await database.transaction("rw", database.workouts, database.workoutCardioMetrics, async () => {
    await database.workouts.add(workout);
    await database.workoutCardioMetrics.add(metric);
  });

  await recalculateDailySummaries(database);
  const progress = await recalculateUserProgress(database);
  await recalculateAchievements(database);
  await applyWorkoutToAdventureTargets(workoutId, database);
  await recalculateAdventure(database);
  const saved = await database.workouts.get(workoutId);
  if (!saved) {
    throw new Error("Cardio workout save failed.");
  }
  if ((options.source ?? "train") === "train") {
    const activity = await database.activities.get(saved.activityId);
    if (activity) {
      await createTrainLogForWorkout(
        { profileId, activity, workout: saved, sets: [], cardioMetric: metric },
        database
      );
    }
  }
  return { workout: saved, sets: [], cardioMetric: metric, progress };
};

export const completeWorkoutDraft = async (
  draft: ActiveWorkoutDraft,
  database: PenRepsDatabase = db
) => {
  const endedAt = nowIso();
  const localDate = toLocalDate(endedAt);
  const sets = draft.sets.map((set) => ({
    ...set,
    localDate,
    activityId: draft.activityId
  }));
  const input: CompletedWorkoutInput = {
    activityId: draft.activityId,
    startedAt: draft.startedAt,
    endedAt,
    localDate,
    mode: draft.mode,
    sets
  };

  if (draft.notes) {
    input.notes = draft.notes;
  }

  const result =
    draft.mode === "cardio"
      ? await createCardioWorkout(
          {
            activityId: draft.activityId,
            startedAt: draft.startedAt,
            endedAt,
            localDate,
            distanceMeters: draft.cardioDistanceMeters ?? 0,
            durationSeconds: draft.cardioDurationSeconds ?? draft.cardioAccumulatedSeconds ?? 0,
            ...(draft.cardioAverageSpeedKmh !== undefined
              ? { averageSpeedKmh: draft.cardioAverageSpeedKmh }
              : {}),
            ...(draft.cardioInclinePercent !== undefined
              ? { inclinePercent: draft.cardioInclinePercent }
              : {}),
            ...(draft.cardioAverageHeartRate !== undefined
              ? { averageHeartRate: draft.cardioAverageHeartRate }
              : {}),
            ...(draft.cardioMaxHeartRate !== undefined
              ? { maxHeartRate: draft.cardioMaxHeartRate }
              : {}),
            ...(draft.cardioPerceivedEffort !== undefined
              ? { perceivedEffort: draft.cardioPerceivedEffort }
              : {}),
            ...(draft.notes ? { notes: draft.notes } : {})
          },
          database
        )
      : await createCompletedWorkout(input, database);

  await deleteActiveWorkoutDraft(database);
  return result;
};

export const updateCompletedWorkout = async (
  workoutId: string,
  updates: { notes?: string; sets: WorkoutSet[] },
  database: PenRepsDatabase = db
) => {
  const existing = await database.workouts.get(workoutId);
  const existingTrainLog = await database.trainLogs.where("workoutId").equals(workoutId).first();
  if (!existing) {
    throw new Error("Workout not found.");
  }

  const normalizedSets: WorkoutSet[] = updates.sets.map((set, index) => ({
    ...set,
    ...(existing.profileId ? { profileId: existing.profileId } : {}),
    workoutId,
    activityId: existing.activityId,
    localDate: existing.localDate,
    setIndex: index + 1,
    id: set.id || createId()
  }));
  const next: Workout = {
    ...existing,
    updatedAt: nowIso()
  };

  if (updates.notes?.trim()) {
    next.notes = updates.notes.trim();
  } else {
    delete next.notes;
  }

  await database.transaction("rw", database.workouts, database.workoutSets, async () => {
    await database.workouts.put(next);
    await database.workoutSets.where("workoutId").equals(workoutId).delete();
    if (normalizedSets.length > 0) {
      await database.workoutSets.bulkPut(normalizedSets);
    }
  });

  await recalculateDailySummaries(database);
  await recalculateUserProgress(database);
  await recalculateAchievements(database);
  await recalculateAdventure(database);

  const result = await getWorkoutWithSets(workoutId, database);
  if (existingTrainLog && result) {
    const activity = await database.activities.get(result.workout.activityId);
    if (activity) {
      await createTrainLogForWorkout(
        {
          profileId: result.workout.profileId ?? (await getActiveProfileId(database)),
          activity,
          workout: result.workout,
          sets: result.sets
        },
        database
      );
    }
  }

  return result;
};

export const updateCompletedCardioWorkout = async (
  workoutId: string,
  updates: {
    notes?: string;
    distanceMeters?: number;
    durationSeconds?: number;
    averageSpeedKmh?: number;
    inclinePercent?: number;
    averageHeartRate?: number;
    maxHeartRate?: number;
    perceivedEffort?: number;
  },
  database: PenRepsDatabase = db
) => {
  const existing = await database.workouts.get(workoutId);
  const existingMetric = await database.workoutCardioMetrics
    .where("workoutId")
    .equals(workoutId)
    .first();
  const existingTrainLog = await database.trainLogs.where("workoutId").equals(workoutId).first();

  if (!existing || !existingMetric || existing.mode !== "cardio") {
    throw new Error("Cardio workout not found.");
  }

  const timestamp = nowIso();
  const normalized = normalizeCardioMetricValues({
    distanceMeters: updates.distanceMeters ?? existingMetric.distanceMeters,
    durationSeconds: updates.durationSeconds ?? existingMetric.durationSeconds,
    averageSpeedKmh: updates.averageSpeedKmh ?? existingMetric.averageSpeedKmh,
    inclinePercent: updates.inclinePercent ?? existingMetric.inclinePercent,
    averageHeartRate: updates.averageHeartRate ?? existingMetric.averageHeartRate,
    maxHeartRate: updates.maxHeartRate ?? existingMetric.maxHeartRate,
    perceivedEffort: updates.perceivedEffort ?? existingMetric.perceivedEffort
  });
  const nextWorkout: Workout = {
    ...existing,
    durationSeconds: normalized.durationSeconds,
    updatedAt: timestamp
  };
  if (updates.notes?.trim()) {
    nextWorkout.notes = updates.notes.trim();
  } else if (updates.notes !== undefined) {
    delete nextWorkout.notes;
  }

  const nextMetric: WorkoutCardioMetric = {
    ...existingMetric,
    distanceMeters: normalized.distanceMeters,
    durationSeconds: normalized.durationSeconds,
    updatedAt: timestamp
  };
  if (normalized.averageSpeedKmh !== undefined) {
    nextMetric.averageSpeedKmh = normalized.averageSpeedKmh;
  }
  if (normalized.paceSecondsPerKm !== undefined) {
    nextMetric.paceSecondsPerKm = normalized.paceSecondsPerKm;
  }
  if (normalized.inclinePercent !== undefined) {
    nextMetric.inclinePercent = normalized.inclinePercent;
    nextMetric.averageInclinePercent = normalized.inclinePercent;
    nextMetric.maxInclinePercent = normalized.inclinePercent;
  }
  if (normalized.elevationGainMeters !== undefined) {
    nextMetric.elevationGainMeters = normalized.elevationGainMeters;
  }
  if (normalized.averageHeartRate !== undefined) {
    nextMetric.averageHeartRate = normalized.averageHeartRate;
  }
  if (normalized.maxHeartRate !== undefined) {
    nextMetric.maxHeartRate = normalized.maxHeartRate;
  }
  if (normalized.perceivedEffort !== undefined) {
    nextMetric.perceivedEffort = normalized.perceivedEffort;
  }

  await database.transaction("rw", database.workouts, database.workoutCardioMetrics, async () => {
    await database.workouts.put(nextWorkout);
    await database.workoutCardioMetrics.put(nextMetric);
  });

  await recalculateDailySummaries(database);
  await recalculateUserProgress(database);
  await recalculateAchievements(database);
  await recalculateAdventure(database);

  const result = await getWorkoutWithSets(workoutId, database);
  if (existingTrainLog && result?.cardioMetric) {
    const activity = await database.activities.get(result.workout.activityId);
    if (activity) {
      await createTrainLogForWorkout(
        {
          profileId: result.workout.profileId ?? (await getActiveProfileId(database)),
          activity,
          workout: result.workout,
          sets: [],
          cardioMetric: result.cardioMetric
        },
        database
      );
    }
  }

  return result;
};

export const deleteWorkout = async (workoutId: string, database: PenRepsDatabase = db) => {
  await database.transaction(
    "rw",
    database.workouts,
    database.workoutSets,
    database.workoutCardioMetrics,
    database.trainLogs,
    async () => {
      await database.workouts.delete(workoutId);
      await database.workoutSets.where("workoutId").equals(workoutId).delete();
      await database.workoutCardioMetrics.where("workoutId").equals(workoutId).delete();
      await database.trainLogs.where("workoutId").equals(workoutId).delete();
    }
  );

  await recalculateDailySummaries(database);
  await recalculateUserProgress(database);
  await recalculateAchievements(database);
  await recalculateAdventure(database);
};
