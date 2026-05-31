import Dexie, { type Table } from "dexie";
import type {
  Achievement,
  ActiveAdventureTarget,
  ActiveWorkoutDraft,
  Activity,
  AdventureBoss,
  AdventureChest,
  AdventureEvent,
  AdventureHitRequirement,
  AdventureMob,
  AdventureMobRequirement,
  AdventureProgress,
  AdventureRegion,
  AppMeta,
  DailyActivitySummary,
  HealthLog,
  HealthTask,
  HeroProgress,
  HeroSkill,
  LocalProfile,
  ProfileHistoryEntry,
  Settings,
  TrainLog,
  UserEquipmentInventoryItem,
  UserProgress,
  Workout,
  WorkoutCardioMetric,
  WorkoutSet
} from "./schema";

export class PenRepsDatabase extends Dexie {
  profiles!: Table<LocalProfile, string>;
  profileHistory!: Table<ProfileHistoryEntry, string>;
  appMeta!: Table<AppMeta, string>;
  healthTasks!: Table<HealthTask, string>;
  healthLogs!: Table<HealthLog, string>;
  userEquipmentInventory!: Table<UserEquipmentInventoryItem, string>;
  activities!: Table<Activity, string>;
  trainLogs!: Table<TrainLog, string>;
  adventureProgress!: Table<AdventureProgress, string>;
  workouts!: Table<Workout, string>;
  workoutSets!: Table<WorkoutSet, string>;
  workoutCardioMetrics!: Table<WorkoutCardioMetric, string>;
  dailySummaries!: Table<DailyActivitySummary, string>;
  settings!: Table<Settings, string>;
  achievements!: Table<Achievement, string>;
  userProgress!: Table<UserProgress, string>;
  heroProgress!: Table<HeroProgress, string>;
  heroSkills!: Table<HeroSkill, string>;
  adventureRegions!: Table<AdventureRegion, string>;
  adventureBosses!: Table<AdventureBoss, string>;
  adventureChests!: Table<AdventureChest, string>;
  adventureHitRequirements!: Table<AdventureHitRequirement, string>;
  adventureMobs!: Table<AdventureMob, string>;
  adventureMobRequirements!: Table<AdventureMobRequirement, string>;
  adventureEvents!: Table<AdventureEvent, string>;
  activeAdventureTarget!: Table<ActiveAdventureTarget, string>;
  activeWorkoutDraft!: Table<ActiveWorkoutDraft, string>;

  // Keep the legacy IndexedDB name so existing offline installs keep their local data.
  constructor(name = "pan-reps") {
    super(name);

    this.version(1).stores({
      activities: "id, &slug, unit, isDefault, isArchived, updatedAt",
      workouts: "id, activityId, localDate, startedAt, endedAt, [activityId+localDate]",
      workoutSets:
        "id, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics: "id, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries: "id, localDate, activityId, [activityId+localDate]",
      settings: "id",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id",
      heroSkills: "id, slug",
      adventureRegions: "id, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureEvents: "id, type, localDate, createdAt",
      activeWorkoutDraft: "id, activityId, updatedAt"
    });

    this.version(2).stores({
      activities: "id, &slug, unit, isDefault, isArchived, updatedAt",
      workouts: "id, activityId, localDate, startedAt, endedAt, [activityId+localDate]",
      workoutSets:
        "id, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics: "id, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries: "id, localDate, activityId, [activityId+localDate]",
      settings: "id",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id",
      heroSkills: "id, slug",
      adventureRegions: "id, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureEvents: "id, type, localDate, createdAt",
      activeWorkoutDraft: "id, activityId, updatedAt"
    });

    this.version(3).stores({
      activities: "id, &slug, unit, activityType, isDefault, isArchived, updatedAt",
      workouts: "id, activityId, localDate, startedAt, endedAt, mode, [activityId+localDate]",
      workoutSets:
        "id, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics: "id, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries: "id, localDate, activityId, [activityId+localDate]",
      settings: "id",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id",
      heroSkills: "id, slug",
      adventureRegions: "id, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureEvents: "id, type, localDate, createdAt",
      activeWorkoutDraft: "id, activityId, updatedAt"
    });

    this.version(4).stores({
      activities: "id, &slug, unit, activityType, isDefault, isArchived, updatedAt",
      workouts: "id, activityId, localDate, startedAt, endedAt, mode, [activityId+localDate]",
      workoutSets:
        "id, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics: "id, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries: "id, localDate, activityId, [activityId+localDate]",
      settings: "id",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id",
      heroSkills: "id, slug",
      adventureRegions: "id, status, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureMobs: "id, slug, realmId, status, updatedAt",
      adventureMobRequirements: "id, mobId, activityId, activitySlug, activityType, metric",
      adventureEvents: "id, type, localDate, createdAt",
      activeAdventureTarget: "id, realmId, mobId, bossId, updatedAt",
      activeWorkoutDraft: "id, activityId, updatedAt"
    });

    this.version(5).stores({
      activities: "id, &slug, unit, activityType, isDefault, isArchived, updatedAt",
      workouts: "id, activityId, localDate, startedAt, endedAt, mode, [activityId+localDate]",
      workoutSets:
        "id, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics: "id, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries: "id, localDate, activityId, [activityId+localDate]",
      settings: "id",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id",
      heroSkills: "id, slug",
      adventureRegions: "id, status, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureChests: "id, slug, realmId, status, updatedAt",
      adventureHitRequirements: "id, enemyId, activityId, activitySlug, activityType, metric",
      adventureMobs: "id, slug, realmId, enemyType, status, updatedAt",
      adventureMobRequirements: "id, mobId, activityId, activitySlug, activityType, metric",
      adventureEvents: "id, type, localDate, createdAt",
      activeAdventureTarget: "id, realmId, mobId, bossId, updatedAt",
      activeWorkoutDraft: "id, activityId, updatedAt"
    });

    this.version(6).stores({
      profiles: "id, active, lastUsedAt, updatedAt",
      appMeta: "id, activeProfileId, updatedAt",
      activities: "id, &slug, unit, activityType, isDefault, isArchived, updatedAt",
      trainLogs: "id, profileId, workoutId, exerciseId, trackingType, createdAt, updatedAt",
      adventureProgress: "id, profileId, selectedRealmId, updatedAt",
      workouts:
        "id, profileId, activityId, localDate, startedAt, endedAt, mode, [profileId+localDate], [activityId+localDate]",
      workoutSets:
        "id, profileId, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics:
        "id, profileId, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries:
        "id, profileId, localDate, activityId, [profileId+localDate], [activityId+localDate]",
      settings: "id, profileId",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id, profileId",
      heroSkills: "id, slug",
      adventureRegions: "id, status, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureChests: "id, slug, realmId, status, updatedAt",
      adventureHitRequirements: "id, enemyId, activityId, activitySlug, activityType, metric",
      adventureMobs: "id, slug, realmId, enemyType, status, updatedAt",
      adventureMobRequirements: "id, mobId, activityId, activitySlug, activityType, metric",
      adventureEvents: "id, profileId, type, localDate, createdAt",
      activeAdventureTarget: "id, realmId, mobId, bossId, updatedAt",
      activeWorkoutDraft: "id, profileId, activityId, updatedAt"
    });

    this.version(7).stores({
      profiles: "id, active, lastUsedAt, updatedAt",
      profileHistory: "id, profileId, field, createdAt",
      appMeta: "id, activeProfileId, updatedAt",
      activities: "id, &slug, unit, activityType, isDefault, isArchived, updatedAt",
      trainLogs: "id, profileId, workoutId, exerciseId, trackingType, createdAt, updatedAt",
      adventureProgress: "id, profileId, selectedRealmId, updatedAt",
      workouts:
        "id, profileId, activityId, localDate, startedAt, endedAt, mode, [profileId+localDate], [activityId+localDate]",
      workoutSets:
        "id, profileId, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics:
        "id, profileId, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries:
        "id, profileId, localDate, activityId, [profileId+localDate], [activityId+localDate]",
      settings: "id, profileId",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id, profileId",
      heroSkills: "id, slug",
      adventureRegions: "id, status, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureChests: "id, slug, realmId, status, updatedAt",
      adventureHitRequirements: "id, enemyId, activityId, activitySlug, activityType, metric",
      adventureMobs: "id, slug, realmId, enemyType, status, updatedAt",
      adventureMobRequirements: "id, mobId, activityId, activitySlug, activityType, metric",
      adventureEvents: "id, profileId, type, localDate, createdAt",
      activeAdventureTarget: "id, realmId, mobId, bossId, updatedAt",
      activeWorkoutDraft: "id, profileId, activityId, updatedAt"
    });

    this.version(8).stores({
      profiles: "id, active, lastUsedAt, updatedAt",
      profileHistory: "id, profileId, field, createdAt",
      appMeta: "id, activeProfileId, updatedAt",
      healthTasks: "id, &slug, unit, cadence, isDefault, isArchived, updatedAt",
      healthLogs: "id, profileId, taskId, localDate, createdAt, [profileId+localDate]",
      userEquipmentInventory: "id, profileId, equipmentKey, category, isOwned, updatedAt",
      activities: "id, &slug, unit, activityType, isDefault, isArchived, updatedAt",
      trainLogs: "id, profileId, workoutId, exerciseId, trackingType, createdAt, updatedAt",
      adventureProgress: "id, profileId, selectedRealmId, updatedAt",
      workouts:
        "id, profileId, activityId, localDate, startedAt, endedAt, mode, [profileId+localDate], [activityId+localDate]",
      workoutSets:
        "id, profileId, workoutId, activityId, localDate, startedAt, endedAt, [workoutId+setIndex], [activityId+localDate]",
      workoutCardioMetrics:
        "id, profileId, workoutId, activityId, localDate, [activityId+localDate]",
      dailySummaries:
        "id, profileId, localDate, activityId, [profileId+localDate], [activityId+localDate]",
      settings: "id, profileId",
      achievements: "id, slug, activityId, unlockedAt",
      userProgress: "id",
      heroProgress: "id, profileId",
      heroSkills: "id, slug",
      adventureRegions: "id, status, isUnlocked, bossId",
      adventureBosses: "id, slug, regionId, status",
      adventureChests: "id, slug, realmId, status, updatedAt",
      adventureHitRequirements: "id, enemyId, activityId, activitySlug, activityType, metric",
      adventureMobs: "id, slug, realmId, enemyType, status, updatedAt",
      adventureMobRequirements: "id, mobId, activityId, activitySlug, activityType, metric",
      adventureEvents: "id, profileId, type, localDate, createdAt",
      activeAdventureTarget: "id, realmId, mobId, bossId, updatedAt",
      activeWorkoutDraft: "id, profileId, activityId, updatedAt"
    });
  }
}

export const db = new PenRepsDatabase();

export const createPenRepsDatabase = (name: string) => new PenRepsDatabase(name);
