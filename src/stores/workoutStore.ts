import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import {
  deleteActiveWorkoutDraft,
  getActiveWorkoutDraft,
  saveActiveWorkoutDraft
} from "../db/repositories/activeWorkoutRepo";
import { completeWorkoutDraft, type WorkoutWithSets } from "../db/repositories/workoutsRepo";
import type {
  ActiveWorkoutDraft,
  ActiveWorkoutSetDraft,
  Activity,
  RestTimerState,
  WorkoutMode
} from "../db/schema";
import { nowIso, toLocalDate } from "../utils/dates";
import { createId } from "../utils/ids";
import { makeRestTimerState, secondsBetween } from "../utils/timers";
import { normalizeCardioMetricValues } from "../utils/workoutMetrics";

interface WorkoutStore {
  draft: ActiveWorkoutDraft | undefined;
  summary: WorkoutWithSets | undefined;
  draftLoaded: boolean;
  setSummary: (summary: WorkoutWithSets | undefined) => void;
  loadDraft: () => Promise<ActiveWorkoutDraft | undefined>;
  startWorkout: (activity: Activity, mode: WorkoutMode) => Promise<ActiveWorkoutDraft>;
  setModeBeforeStart: (mode: WorkoutMode) => Promise<void>;
  addRep: () => Promise<void>;
  undoLiveRep: () => Promise<"rep" | "needs-confirmation" | "empty">;
  deleteLastSet: () => Promise<boolean>;
  completeCurrentLiveSet: () => Promise<void>;
  saveManualSet: (
    value: number,
    startedAt?: string,
    endedAt?: string,
    weightKg?: number
  ) => Promise<void>;
  startTimedSet: () => Promise<void>;
  stopTimedSet: () => Promise<void>;
  updateCardioMetrics: (metrics: {
    distanceMeters?: number;
    durationSeconds?: number;
    averageSpeedKmh?: number;
    inclinePercent?: number;
    averageHeartRate?: number;
    maxHeartRate?: number;
    perceivedEffort?: number;
  }) => Promise<void>;
  startCardioTimer: () => Promise<void>;
  pauseCardioTimer: () => Promise<void>;
  startRest: (durationSeconds: number) => Promise<void>;
  adjustRest: (deltaSeconds: number) => Promise<void>;
  cancelRest: () => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  endWorkout: () => Promise<WorkoutWithSets | undefined>;
  discardDraft: () => Promise<void>;
}

const persist = async (draft: ActiveWorkoutDraft | undefined) => {
  if (!draft) {
    return undefined;
  }

  return saveActiveWorkoutDraft(draft);
};

const replaceDraft = async (
  get: () => WorkoutStore,
  set: Parameters<StateCreator<WorkoutStore>>[0],
  recipe: (draft: ActiveWorkoutDraft) => ActiveWorkoutDraft
) => {
  const draft = get().draft;
  if (!draft) {
    return;
  }

  const next = await persist(recipe(draft));
  set({ draft: next });
};

const createDraftSet = (
  draft: ActiveWorkoutDraft,
  value: number,
  startedAt = nowIso(),
  endedAt = nowIso(),
  weightKg?: number
): ActiveWorkoutSetDraft => {
  const set: ActiveWorkoutSetDraft = {
    id: createId(),
    activityId: draft.activityId,
    setIndex: draft.sets.length + 1,
    value: Math.max(0, Math.floor(value)),
    startedAt,
    localDate: toLocalDate(endedAt)
  };

  if (weightKg !== undefined && Number.isFinite(weightKg) && weightKg > 0) {
    set.weightKg = weightKg;
  }

  if (endedAt) {
    set.endedAt = endedAt;
    set.durationSeconds = secondsBetween(startedAt, endedAt);
  }

  return set;
};

const applyRestAfterLastSet = (
  sets: ActiveWorkoutSetDraft[],
  restTimer: RestTimerState
): ActiveWorkoutSetDraft[] => {
  if (sets.length === 0) {
    return sets;
  }

  return sets.map((set, index) =>
    index === sets.length - 1 ? { ...set, restSecondsAfter: restTimer.durationSeconds } : set
  );
};

const initializer: StateCreator<WorkoutStore> = (set, get) => ({
  draft: undefined,
  summary: undefined,
  draftLoaded: false,
  setSummary: (summary) => set({ summary }),
  loadDraft: async () => {
    const draft = await getActiveWorkoutDraft();
    set({ draft, draftLoaded: true });
    return draft;
  },
  startWorkout: async (activity, mode) => {
    const startedAt = nowIso();
    const draft: ActiveWorkoutDraft = {
      id: "active",
      activityId: activity.id,
      mode,
      startedAt,
      localDate: toLocalDate(startedAt),
      currentSetValue: 0,
      sets: [],
      updatedAt: startedAt
    };
    const saved = await saveActiveWorkoutDraft(draft);
    set({ draft: saved, summary: undefined, draftLoaded: true });
    return saved;
  },
  setModeBeforeStart: async (mode) => {
    await replaceDraft(get, set, (draft) => ({ ...draft, mode }));
  },
  addRep: async () => {
    await replaceDraft(get, set, (draft) => ({
      ...draft,
      currentSetValue: draft.currentSetValue + 1
    }));
  },
  undoLiveRep: async () => {
    const draft = get().draft;
    if (!draft) {
      return "empty";
    }
    if (draft.currentSetValue > 0) {
      await replaceDraft(get, set, (current) => ({
        ...current,
        currentSetValue: Math.max(0, current.currentSetValue - 1)
      }));
      return "rep";
    }
    if (draft.sets.length > 0) {
      return "needs-confirmation";
    }
    return "empty";
  },
  deleteLastSet: async () => {
    const draft = get().draft;
    if (!draft || draft.sets.length === 0) {
      return false;
    }

    await replaceDraft(get, set, (current) => ({
      ...current,
      sets: current.sets.slice(0, -1)
    }));
    return true;
  },
  completeCurrentLiveSet: async () => {
    const draft = get().draft;
    if (!draft || draft.currentSetValue <= 0) {
      return;
    }

    const startedAt = draft.sets[draft.sets.length - 1]?.endedAt ?? draft.startedAt;
    const nextSet = createDraftSet(draft, draft.currentSetValue, startedAt, nowIso());
    await replaceDraft(get, set, (current) => ({
      ...current,
      currentSetValue: 0,
      sets: [...current.sets, nextSet]
    }));
  },
  saveManualSet: async (value, startedAt, endedAt, weightKg) => {
    const draft = get().draft;
    if (!draft || value <= 0) {
      return;
    }

    const end = endedAt ?? nowIso();
    const start = startedAt ?? end;
    const nextSet = createDraftSet(draft, value, start, end, weightKg);
    await replaceDraft(get, set, (current) => ({
      ...current,
      currentSetValue: 0,
      sets: [...current.sets, nextSet]
    }));
  },
  startTimedSet: async () => {
    await replaceDraft(get, set, (draft) => ({
      ...draft,
      currentSetValue: Date.now()
    }));
  },
  stopTimedSet: async () => {
    const draft = get().draft;
    if (!draft || draft.currentSetValue <= 0) {
      return;
    }

    const startedAt = new Date(draft.currentSetValue).toISOString();
    const endedAt = nowIso();
    const seconds = secondsBetween(startedAt, endedAt);
    const nextSet = createDraftSet(draft, seconds, startedAt, endedAt);
    await replaceDraft(get, set, (current) => ({
      ...current,
      currentSetValue: 0,
      sets: [...current.sets, nextSet]
    }));
  },
  updateCardioMetrics: async (metrics) => {
    await replaceDraft(get, set, (draft) => {
      const next: ActiveWorkoutDraft = { ...draft };
      const normalized = normalizeCardioMetricValues({
        distanceMeters: metrics.distanceMeters ?? draft.cardioDistanceMeters,
        durationSeconds: metrics.durationSeconds ?? draft.cardioDurationSeconds,
        averageSpeedKmh: metrics.averageSpeedKmh ?? draft.cardioAverageSpeedKmh,
        inclinePercent: metrics.inclinePercent ?? draft.cardioInclinePercent,
        averageHeartRate: metrics.averageHeartRate ?? draft.cardioAverageHeartRate,
        maxHeartRate: metrics.maxHeartRate ?? draft.cardioMaxHeartRate,
        perceivedEffort: metrics.perceivedEffort ?? draft.cardioPerceivedEffort
      });
      next.cardioDistanceMeters = normalized.distanceMeters;
      next.cardioDurationSeconds = normalized.durationSeconds;
      if (!draft.cardioTimerStartedAt) {
        next.cardioAccumulatedSeconds = normalized.durationSeconds;
      }
      if (normalized.averageSpeedKmh !== undefined) {
        next.cardioAverageSpeedKmh = normalized.averageSpeedKmh;
      }
      if (normalized.inclinePercent !== undefined) {
        next.cardioInclinePercent = normalized.inclinePercent;
      }
      if (normalized.averageHeartRate !== undefined) {
        next.cardioAverageHeartRate = normalized.averageHeartRate;
      }
      if (normalized.maxHeartRate !== undefined) {
        next.cardioMaxHeartRate = normalized.maxHeartRate;
      }
      if (normalized.perceivedEffort !== undefined) {
        next.cardioPerceivedEffort = normalized.perceivedEffort;
      }
      return next;
    });
  },
  startCardioTimer: async () => {
    await replaceDraft(get, set, (draft) => ({
      ...draft,
      cardioTimerStartedAt: nowIso()
    }));
  },
  pauseCardioTimer: async () => {
    await replaceDraft(get, set, (draft) => {
      if (!draft.cardioTimerStartedAt) {
        return draft;
      }
      const elapsed = secondsBetween(draft.cardioTimerStartedAt, nowIso());
      const accumulated =
        (draft.cardioAccumulatedSeconds ?? draft.cardioDurationSeconds ?? 0) + elapsed;
      const next: ActiveWorkoutDraft = {
        ...draft,
        cardioAccumulatedSeconds: accumulated,
        cardioDurationSeconds: accumulated
      };
      delete next.cardioTimerStartedAt;
      return next;
    });
  },
  startRest: async (durationSeconds) => {
    const restTimer = makeRestTimerState(durationSeconds);
    await replaceDraft(get, set, (draft) => ({
      ...draft,
      restTimer,
      sets: applyRestAfterLastSet(draft.sets, restTimer)
    }));
  },
  adjustRest: async (deltaSeconds) => {
    await replaceDraft(get, set, (draft) => {
      const currentDuration = draft.restTimer?.durationSeconds ?? 45;
      const nextDuration = Math.max(5, currentDuration + deltaSeconds);
      const restTimer = makeRestTimerState(nextDuration);
      return {
        ...draft,
        restTimer,
        sets: applyRestAfterLastSet(draft.sets, restTimer)
      };
    });
  },
  cancelRest: async () => {
    await replaceDraft(get, set, (draft) => {
      const next: ActiveWorkoutDraft = {
        ...draft
      };
      delete next.restTimer;
      return next;
    });
  },
  updateNotes: async (notes) => {
    await replaceDraft(get, set, (draft) => {
      const next: ActiveWorkoutDraft = {
        ...draft
      };
      if (notes.trim()) {
        next.notes = notes;
      } else {
        delete next.notes;
      }
      return next;
    });
  },
  endWorkout: async () => {
    let draft = get().draft;
    if (!draft || draft.sets.length === 0) {
      if (draft?.mode === "cardio") {
        if (draft.cardioTimerStartedAt) {
          const elapsed = secondsBetween(draft.cardioTimerStartedAt, nowIso());
          const pausedDraft: ActiveWorkoutDraft = {
            ...draft,
            cardioDurationSeconds:
              (draft.cardioAccumulatedSeconds ?? draft.cardioDurationSeconds ?? 0) + elapsed,
            cardioAccumulatedSeconds:
              (draft.cardioAccumulatedSeconds ?? draft.cardioDurationSeconds ?? 0) + elapsed,
            updatedAt: nowIso()
          };
          delete pausedDraft.cardioTimerStartedAt;
          draft = await saveActiveWorkoutDraft(pausedDraft);
        }
        const result = await completeWorkoutDraft(draft);
        const summary: WorkoutWithSets = { workout: result.workout, sets: result.sets };
        if (result.cardioMetric) {
          summary.cardioMetric = result.cardioMetric;
        }
        set({
          draft: undefined,
          summary
        });
        return summary;
      }
      await deleteActiveWorkoutDraft();
      set({ draft: undefined });
      return undefined;
    }

    const result = await completeWorkoutDraft(draft);
    const summary: WorkoutWithSets = { workout: result.workout, sets: result.sets };
    if (result.cardioMetric) {
      summary.cardioMetric = result.cardioMetric;
    }
    set({
      draft: undefined,
      summary
    });
    return summary;
  },
  discardDraft: async () => {
    await deleteActiveWorkoutDraft();
    set({ draft: undefined, draftLoaded: true });
  }
});

export const useWorkoutStore = import.meta.env.DEV
  ? create<WorkoutStore>()(devtools(initializer, { name: "Fit Quest Workout" }))
  : create<WorkoutStore>()(initializer);
