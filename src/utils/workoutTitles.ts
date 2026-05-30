import type { Activity, WorkoutMode } from "../db/schema";
import { APP_NAME } from "./appIdentity";

export type WorkoutTitleState = "idle" | "active" | "rest";

const modeLabels: Record<WorkoutMode, string> = {
  live: "Live Counter",
  setEntry: "Log Sets",
  timed: "Timed",
  cardio: "Cardio"
};

export const getWorkoutTitle = (
  activity: Pick<Activity, "name"> | undefined,
  mode: WorkoutMode | undefined,
  state: WorkoutTitleState
) => {
  if (!activity || !mode || state === "idle") {
    return APP_NAME;
  }

  if (state === "rest") {
    return `Rest | ${activity.name}`;
  }

  return `${activity.name} | ${modeLabels[mode]}`;
};
