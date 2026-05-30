import { nowIso } from "../../utils/dates";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { ActiveWorkoutDraft } from "../schema";
import { getActiveProfileId } from "./profilesRepo";

export const getActiveWorkoutDraft = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const draft = await database.activeWorkoutDraft.get("active");
  return draft && (!draft.profileId || draft.profileId === profileId) ? draft : undefined;
};

export const saveActiveWorkoutDraft = async (
  draft: ActiveWorkoutDraft,
  database: PenRepsDatabase = db
) => {
  const profileId = await getActiveProfileId(database);
  const next: ActiveWorkoutDraft = {
    ...draft,
    id: "active",
    profileId,
    updatedAt: nowIso()
  };

  await database.activeWorkoutDraft.put(next);
  return next;
};

export const deleteActiveWorkoutDraft = async (database: PenRepsDatabase = db) => {
  await database.activeWorkoutDraft.delete("active");
};
