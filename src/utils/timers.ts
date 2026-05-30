import { nowIso } from "./dates";

export interface TimerSnapshot {
  remainingSeconds: number;
  isComplete: boolean;
}

export const createTargetEndAt = (durationSeconds: number, startedAt = new Date()) =>
  new Date(startedAt.getTime() + Math.max(0, durationSeconds) * 1000).toISOString();

export const getRemainingSeconds = (targetEndAt: string, now = Date.now()) =>
  Math.max(0, Math.ceil((new Date(targetEndAt).getTime() - now) / 1000));

export const getTimerSnapshot = (targetEndAt: string, now = Date.now()): TimerSnapshot => {
  const remainingSeconds = getRemainingSeconds(targetEndAt, now);

  return {
    remainingSeconds,
    isComplete: remainingSeconds <= 0
  };
};

export const makeRestTimerState = (durationSeconds: number) => {
  const startedAt = new Date();

  return {
    startedAt: nowIso(),
    targetEndAt: createTargetEndAt(durationSeconds, startedAt),
    durationSeconds: Math.max(1, Math.floor(durationSeconds))
  };
};

export const secondsBetween = (startIso: string, endIso: string) =>
  Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000));
