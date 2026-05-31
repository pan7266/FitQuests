import { nowIso } from "../../utils/dates";
import { createId } from "../../utils/ids";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { ProfileHistoryEntry } from "../schema";
import { getActiveProfileId } from "./profilesRepo";

export type ProfileHistoryField = ProfileHistoryEntry["field"];

export interface ProfileHistoryChange {
  field: ProfileHistoryField;
  previousValue?: string | undefined;
  nextValue?: string | undefined;
}

export const createProfileHistoryEntries = async (
  changes: ProfileHistoryChange[],
  database: PenRepsDatabase = db
) => {
  const meaningfulChanges = changes.filter((change) => change.previousValue !== change.nextValue);
  if (meaningfulChanges.length === 0) {
    return [];
  }

  const profileId = await getActiveProfileId(database);
  const timestamp = nowIso();
  const entries: ProfileHistoryEntry[] = meaningfulChanges.map((change) => ({
    id: `profile_history_${createId()}`,
    profileId,
    field: change.field,
    ...(change.previousValue !== undefined ? { previousValue: change.previousValue } : {}),
    ...(change.nextValue !== undefined ? { nextValue: change.nextValue } : {}),
    createdAt: timestamp
  }));

  await database.profileHistory.bulkAdd(entries);
  return entries;
};

export const listProfileHistory = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const entries = await database.profileHistory.where("profileId").equals(profileId).toArray();
  return entries.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};
