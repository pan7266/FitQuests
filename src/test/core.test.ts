import { afterEach, describe, expect, it } from "vitest";
import { createPenRepsDatabase, type PenRepsDatabase } from "../db/db";
import { listAchievements } from "../db/repositories/achievementsRepo";
import {
  getActiveWorkoutDraft,
  saveActiveWorkoutDraft
} from "../db/repositories/activeWorkoutRepo";
import {
  createCustomActivity,
  listActivities,
  updateActivity
} from "../db/repositories/activitiesRepo";
import {
  listAdventureState,
  resolveAdventureHit,
  selectMobTarget
} from "../db/repositories/adventureRepo";
import { listProfiles } from "../db/repositories/profilesRepo";
import { getUserProgress } from "../db/repositories/progressRepo";
import { getSettings, updateSettings } from "../db/repositories/settingsRepo";
import { recalculateDailySummaries } from "../db/repositories/summariesRepo";
import { listTrainLogs } from "../db/repositories/trainLogsRepo";
import { createCardioWorkout, createCompletedWorkout } from "../db/repositories/workoutsRepo";
import type { CompletedWorkoutInput, WorkoutSet } from "../db/schema";
import { DEFAULT_ACTIVITY_IDS, seedAppData, seedPredefinedActivities } from "../db/seed";
import { toLocalDate } from "../utils/dates";
import { parseImportJson, stringifyExport, validateImportPayload } from "../utils/exportImport";
import { createId } from "../utils/ids";
import { getCurrentLevelProgress, getLevelFromXP, getXPForLevel } from "../utils/levels";
import { calculateStreaks } from "../utils/streaks";
import { createTargetEndAt, getRemainingSeconds } from "../utils/timers";

const databases: PenRepsDatabase[] = [];

const createDb = () => {
  const database = createPenRepsDatabase(`fit-quest-test-${createId()}`);
  databases.push(database);
  return database;
};

const makeSet = (params: {
  activityId: string;
  value: number;
  setIndex: number;
  localDate: string;
  startedAt: string;
}): Omit<WorkoutSet, "workoutId"> => ({
  id: createId(),
  activityId: params.activityId,
  setIndex: params.setIndex,
  value: params.value,
  startedAt: params.startedAt,
  endedAt: params.startedAt,
  localDate: params.localDate,
  durationSeconds: 0
});

const makeWorkout = (params: {
  activityId: string;
  localDate: string;
  values: number[];
  startedAt?: string;
}): CompletedWorkoutInput => {
  const startedAt = params.startedAt ?? `${params.localDate}T10:00:00.000Z`;

  return {
    activityId: params.activityId,
    startedAt,
    endedAt: `${params.localDate}T10:05:00.000Z`,
    localDate: params.localDate,
    mode: "setEntry",
    sets: params.values.map((value, index) =>
      makeSet({
        activityId: params.activityId,
        value,
        setIndex: index + 1,
        localDate: params.localDate,
        startedAt
      })
    )
  };
};

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()));
});

describe("Fit Quest core data behavior", () => {
  it("seeds predefined activities without duplicates", async () => {
    const database = createDb();
    await seedPredefinedActivities(database);
    await seedPredefinedActivities(database);

    const activities = await listActivities({ includeArchived: true }, database);

    expect(activities).toHaveLength(5);
    expect(activities.map((activity) => activity.name).sort()).toEqual([
      "Pull-ups",
      "Push-ups",
      "Sit-ups",
      "Squats",
      "Treadmill"
    ]);
  });

  it("seeds large data-driven adventure realm content", async () => {
    const database = createDb();
    await seedAppData(database);

    const adventure = await listAdventureState(database);
    const normalEnemies = adventure.mobs.filter((mob) => mob.enemyType === "normal");
    const elites = adventure.mobs.filter((mob) => mob.enemyType === "elite");

    expect(adventure.regions).toHaveLength(6);
    expect(normalEnemies.length).toBeGreaterThanOrEqual(300);
    expect(elites.length).toBeGreaterThanOrEqual(30);
    expect(adventure.bosses).toHaveLength(12);
    expect(adventure.chests.length).toBeGreaterThanOrEqual(12);
    expect(adventure.chests.length).toBeLessThanOrEqual(18);
    expect(adventure.hitRequirements.length).toBeGreaterThanOrEqual(
      adventure.mobs.length + adventure.bosses.length
    );
    for (const region of adventure.regions) {
      expect(
        adventure.mobs.filter((mob) => mob.realmId === region.id && mob.enemyType === "normal")
          .length
      ).toBeGreaterThan(50);
      expect(
        adventure.mobs.filter((mob) => mob.realmId === region.id && mob.enemyType === "elite")
          .length
      ).toBeGreaterThanOrEqual(5);
      expect(adventure.bosses.filter((boss) => boss.regionId === region.id)).toHaveLength(2);
    }
  });

  it("creates typed custom activities for reps and seconds", async () => {
    const database = createDb();
    await seedAppData(database);

    const hold = await createCustomActivity({ name: "Wall Sit", unit: "seconds" }, database);
    const dips = await createCustomActivity({ name: "Dips", unit: "reps" }, database);

    expect(hold.unit).toBe("seconds");
    expect(dips.unit).toBe("reps");
  });

  it("creates a local profile and syncs instant settings changes", async () => {
    const database = createDb();
    await seedAppData(database);

    const initialSettings = await getSettings(database);
    await updateSettings(
      {
        displayName: "Alex",
        appLanguage: "el",
        uiStyle: "material",
        colorMode: "light",
        accentColor: "#16A34A",
        onboardingCompleted: true
      },
      database
    );

    const [profiles, settings] = await Promise.all([listProfiles(database), getSettings(database)]);
    const activeProfile = profiles.find((profile) => profile.id === settings.profileId);

    expect(initialSettings.profileId).toBeDefined();
    expect(activeProfile).toMatchObject({
      name: "Alex",
      selectedLanguage: "el",
      onboardingCompleted: true,
      selectedTheme: {
        uiStyle: "material",
        colorMode: "light",
        accentColor: "#16A34A"
      }
    });
    expect(settings.displayName).toBe("Alex");
    expect(settings.appLanguage).toBe("el");
  });

  it("generates localDate from the device timezone formatting rule", () => {
    expect(toLocalDate(new Date("2026-04-29T08:30:00"))).toMatch(/2026-04-29/);
  });

  it("recalculates daily summaries from raw workouts and sets", async () => {
    const database = createDb();
    await seedAppData(database);
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        localDate: "2026-04-27",
        values: [8, 10]
      }),
      database
    );

    const summaries = await recalculateDailySummaries(database);

    expect(summaries[0]).toMatchObject({
      id: `2026-04-27_${DEFAULT_ACTIVITY_IDS.pushups}`,
      activityType: "strength",
      totalReps: 18,
      totalSets: 2,
      bestSet: 10,
      workoutCount: 1
    });
  });

  it("stores Train logs for free workouts but not Adventure workout hits", async () => {
    const database = createDb();
    await seedAppData(database);
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        localDate: "2026-04-27",
        values: [10]
      }),
      database
    );
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.squats,
        localDate: "2026-04-27",
        values: [10],
        startedAt: "2026-04-27T11:00:00.000Z"
      }),
      database,
      { source: "adventure" }
    );

    const trainLogs = await listTrainLogs(undefined, database);

    expect(trainLogs).toHaveLength(1);
    expect(trainLogs[0]).toMatchObject({
      exerciseId: DEFAULT_ACTIVITY_IDS.pushups,
      reps: 10
    });
  });

  it("calculates XP, bonuses, and level progress without duplicate edit counting", async () => {
    const database = createDb();
    await seedAppData(database);
    await updateActivity(DEFAULT_ACTIVITY_IDS.pushups, { dailyGoal: 10, weeklyGoal: 20 }, database);
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        localDate: "2026-04-27",
        values: [12]
      }),
      database
    );
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        localDate: "2026-04-28",
        values: [10]
      }),
      database
    );

    const progress = await getUserProgress(database);

    expect(progress.totalXP).toBe(122);
    expect(getLevelFromXP(progress.totalXP)).toBe(2);
    expect(getXPForLevel(2)).toBe(100);
    expect(getCurrentLevelProgress(progress.totalXP).xpIntoLevel).toBe(22);
  });

  it("uses marginal daily goal XP multipliers per activity and local date", async () => {
    const database = createDb();
    await seedAppData(database);
    await updateActivity(DEFAULT_ACTIVITY_IDS.pushups, { dailyGoal: 50 }, database);
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        localDate: "2026-04-27",
        values: [50],
        startedAt: "2026-04-27T09:00:00.000Z"
      }),
      database
    );
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        localDate: "2026-04-27",
        values: [50],
        startedAt: "2026-04-27T12:00:00.000Z"
      }),
      database
    );

    const workouts = await database.workouts.orderBy("startedAt").toArray();
    const progress = await getUserProgress(database);

    expect(workouts.map((workout) => workout.xpAwarded)).toEqual([50, 60]);
    expect(progress.totalXP).toBe(110);
  });

  it("stores treadmill cardio metrics and awards distance-based XP", async () => {
    const database = createDb();
    await seedAppData(database);
    await updateActivity(DEFAULT_ACTIVITY_IDS.treadmill, { dailyGoal: 3000 }, database);
    await createCardioWorkout(
      {
        activityId: DEFAULT_ACTIVITY_IDS.treadmill,
        startedAt: "2026-04-27T10:00:00.000Z",
        endedAt: "2026-04-27T11:00:00.000Z",
        localDate: "2026-04-27",
        distanceMeters: 3000,
        durationSeconds: 3600,
        inclinePercent: 5,
        perceivedEffort: 6
      },
      database
    );

    const [progress, summaries, metrics] = await Promise.all([
      getUserProgress(database),
      recalculateDailySummaries(database),
      database.workoutCardioMetrics.toArray()
    ]);

    expect(progress.totalXP).toBe(30);
    expect(metrics[0]).toMatchObject({
      distanceMeters: 3000,
      durationSeconds: 3600,
      averageSpeedKmh: 3,
      paceSecondsPerKm: 1200,
      inclinePercent: 5,
      perceivedEffort: 6
    });
    expect(summaries[0]).toMatchObject({
      activityType: "cardio",
      totalDistanceMeters: 3000,
      totalDurationSeconds: 3600,
      bestDistanceMeters: 3000
    });
  });

  it("requires a preset battle hit before defeating a selected adventure enemy", async () => {
    const database = createDb();
    await seedAppData(database);
    await selectMobTarget("mob_slime_excuses", database);

    await expect(
      resolveAdventureHit(
        { enemyId: "mob_slime_excuses", metric: "reps", loggedValue: 9 },
        database
      )
    ).rejects.toThrow("Required hit is not complete.");

    await resolveAdventureHit(
      { enemyId: "mob_slime_excuses", metric: "reps", loggedValue: 10 },
      database
    );
    const adventure = await listAdventureState(database);
    const slimeRequirement = adventure.mobRequirements.find(
      (requirement) => requirement.mobId === "mob_slime_excuses"
    );
    const slime = adventure.mobs.find((mob) => mob.id === "mob_slime_excuses");

    expect(slimeRequirement?.currentValue).toBe(10);
    expect(slime?.status).toBe("defeated");
    expect(adventure.activeTarget?.mobId).toBeUndefined();
  });

  it("lets treadmill distance complete a cardio battle hit", async () => {
    const database = createDb();
    await seedAppData(database);
    const initial = await listAdventureState(database);
    const distanceHit = initial.hitRequirements.find((hit) => {
      const mob = initial.mobs.find((item) => item.id === hit.enemyId);
      return hit.metric === "distanceMeters" && mob?.realmId === "region_gate";
    });
    expect(distanceHit).toBeDefined();
    if (!distanceHit) {
      throw new Error("Missing generated distance hit.");
    }
    await selectMobTarget(distanceHit.enemyId, database);
    const result = await resolveAdventureHit(
      {
        enemyId: distanceHit.enemyId,
        metric: "distanceMeters",
        loggedValue: distanceHit.requiredValue
      },
      database
    );

    expect(result.baseDamage).toBe(Math.floor(distanceHit.requiredValue / 100));
    expect(result.finalDamage).toBeGreaterThanOrEqual(1);
  });

  it("calculates streaks from local dates", () => {
    const streak = calculateStreaks(
      ["2026-04-25", "2026-04-26", "2026-04-27", "2026-04-29"],
      new Date("2026-04-29T12:00:00")
    );

    expect(streak.current).toBe(1);
    expect(streak.best).toBe(3);
  });

  it("unlocks achievements after workout and goal recalculation", async () => {
    const database = createDb();
    await seedAppData(database);
    await updateActivity(
      DEFAULT_ACTIVITY_IDS.pushups,
      { weeklyGoal: 20, monthlyGoal: 20 },
      database
    );
    await createCompletedWorkout(
      makeWorkout({
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        localDate: "2026-04-27",
        values: [25]
      }),
      database
    );

    const achievements = await listAchievements(database);
    const unlocked = achievements
      .filter((achievement) => achievement.unlockedAt)
      .map((item) => item.slug);

    expect(unlocked).toContain("first-workout");
    expect(unlocked).toContain("weekly-goal-completed");
    expect(unlocked).toContain("monthly-goal-completed");
  });

  it("persists and recovers active workout drafts", async () => {
    const database = createDb();
    await seedAppData(database);
    await saveActiveWorkoutDraft(
      {
        id: "active",
        activityId: DEFAULT_ACTIVITY_IDS.pushups,
        mode: "live",
        startedAt: "2026-04-29T10:00:00.000Z",
        localDate: "2026-04-29",
        currentSetValue: 4,
        sets: [],
        updatedAt: "2026-04-29T10:00:00.000Z"
      },
      database
    );

    const draft = await getActiveWorkoutDraft(database);

    expect(draft?.currentSetValue).toBe(4);
  });

  it("uses targetEndAt for timer remaining time", () => {
    const startedAt = new Date("2026-04-29T10:00:00.000Z");
    const targetEndAt = createTargetEndAt(45, startedAt);

    expect(getRemainingSeconds(targetEndAt, new Date("2026-04-29T10:00:15.000Z").getTime())).toBe(
      30
    );
    expect(getRemainingSeconds(targetEndAt, new Date("2026-04-29T10:00:50.000Z").getTime())).toBe(
      0
    );
  });

  it("exports and lightly validates import JSON", async () => {
    const database = createDb();
    await seedAppData(database);

    const json = await stringifyExport(database);
    const parsed = parseImportJson(json);

    expect(parsed).toBeDefined();
    expect(validateImportPayload({})).toBe(false);
  });
});
