import { evaluateAchievements } from "../../utils/achievements";
import { nowIso } from "../../utils/dates";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { Achievement } from "../schema";
import { getActiveProfileId } from "./profilesRepo";

export const listAchievements = async (database: PenRepsDatabase = db) => {
  const existing = await database.achievements.toArray();

  if (existing.length > 0) {
    return existing;
  }

  return recalculateAchievements(database);
};

export const recalculateAchievements = async (
  database: PenRepsDatabase = db
): Promise<Achievement[]> => {
  const profileId = await getActiveProfileId(database);
  const [
    activities,
    workouts,
    summaries,
    existing,
    heroProgress,
    heroSkills,
    adventureBosses,
    adventureChests,
    adventureEvents,
    userProgress
  ] = await Promise.all([
    database.activities.toArray(),
    database.workouts
      .toArray()
      .then((items) => items.filter((item) => !item.profileId || item.profileId === profileId)),
    database.dailySummaries
      .toArray()
      .then((items) => items.filter((item) => !item.profileId || item.profileId === profileId)),
    database.achievements.toArray(),
    database.heroProgress.get("hero"),
    database.heroSkills.toArray(),
    database.adventureBosses.toArray(),
    database.adventureChests.toArray(),
    database.adventureEvents
      .toArray()
      .then((items) => items.filter((item) => !item.profileId || item.profileId === profileId)),
    database.userProgress.get("user")
  ]);
  const achievements = evaluateAchievements(
    {
      activities,
      workouts,
      summaries,
      hero: heroProgress,
      skills: heroSkills,
      bosses: adventureBosses,
      chests: adventureChests,
      events: adventureEvents,
      userProgress
    },
    existing,
    nowIso()
  );

  await database.transaction("rw", database.achievements, async () => {
    await database.achievements.clear();
    await database.achievements.bulkPut(achievements);
  });

  return achievements;
};
