import type { PenRepsDatabase } from "../db/db";
import { db } from "../db/db";
import { recalculateAchievements } from "../db/repositories/achievementsRepo";
import { recalculateAdventure } from "../db/repositories/adventureRepo";
import { recalculateUserProgress } from "../db/repositories/progressRepo";
import { recalculateDailySummaries } from "../db/repositories/summariesRepo";
import type {
  Achievement,
  ActiveAdventureTarget,
  ActiveWorkoutDraft,
  Activity,
  AdventureBoss,
  AdventureChest,
  AdventureHitRequirement,
  AdventureMob,
  AdventureMobRequirement,
  AdventureProgress,
  AdventureRegion,
  AppMeta,
  DailyActivitySummary,
  ExportPayload,
  HeroProgress,
  LocalProfile,
  ProfileHistoryEntry,
  Settings,
  TrainLog,
  UserProgress,
  Workout,
  WorkoutCardioMetric,
  WorkoutSet
} from "../db/schema";
import { seedAppData, seedPredefinedActivities } from "../db/seed";
import { nowIso } from "./dates";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isProfile = (value: unknown): value is LocalProfile => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    (value.selectedLanguage === "en" || value.selectedLanguage === "el") &&
    isRecord(value.selectedTheme) &&
    (value.selectedTheme.uiStyle === "neomorphism" ||
      value.selectedTheme.uiStyle === "glassmorphism" ||
      value.selectedTheme.uiStyle === "material" ||
      value.selectedTheme.uiStyle === "ios") &&
    (value.selectedTheme.colorMode === "dark" || value.selectedTheme.colorMode === "light") &&
    isString(value.selectedTheme.accentColor) &&
    (value.selectedTheme.uiDensity === undefined ||
      value.selectedTheme.uiDensity === "cozy" ||
      value.selectedTheme.uiDensity === "compact") &&
    isBoolean(value.onboardingCompleted) &&
    isBoolean(value.active) &&
    isString(value.lastUsedAt)
  );
};

const isProfileHistoryEntry = (value: unknown): value is ProfileHistoryEntry => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.profileId) &&
    (value.field === "displayName" ||
      value.field === "weightKg" ||
      value.field === "heightCm" ||
      value.field === "goalWeightKg") &&
    (value.previousValue === undefined || isString(value.previousValue)) &&
    (value.nextValue === undefined || isString(value.nextValue)) &&
    isString(value.createdAt)
  );
};

const isAppMeta = (value: unknown): value is AppMeta => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.id === "app" &&
    isString(value.activeProfileId) &&
    isNumber(value.schemaVersion) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isActivity = (value: unknown): value is Activity => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.slug) &&
    isString(value.name) &&
    (value.unit === "reps" ||
      value.unit === "seconds" ||
      value.unit === "distance" ||
      value.unit === "weight") &&
    (value.activityType === "strength" ||
      value.activityType === "timed" ||
      value.activityType === "cardio") &&
    isString(value.icon) &&
    isString(value.color) &&
    isNumber(value.defaultRestSeconds) &&
    isBoolean(value.autoRestEnabled) &&
    isNumber(value.dailyGoal) &&
    isNumber(value.weeklyGoal) &&
    isNumber(value.monthlyGoal) &&
    isNumber(value.yearlyGoal) &&
    isBoolean(value.isDefault) &&
    isBoolean(value.isArchived) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isWorkout = (value: unknown): value is Workout => {
  if (!isRecord(value)) {
    return false;
  }

  const hasOptionalStrings =
    (value.endedAt === undefined || isString(value.endedAt)) &&
    (value.notes === undefined || isString(value.notes));

  return (
    isString(value.id) &&
    (value.profileId === undefined || isString(value.profileId)) &&
    isString(value.activityId) &&
    isString(value.startedAt) &&
    hasOptionalStrings &&
    isString(value.localDate) &&
    isNumber(value.durationSeconds) &&
    (value.mode === "live" ||
      value.mode === "setEntry" ||
      value.mode === "timed" ||
      value.mode === "cardio") &&
    isNumber(value.xpAwarded) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isWorkoutSet = (value: unknown): value is WorkoutSet => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    (value.profileId === undefined || isString(value.profileId)) &&
    isString(value.workoutId) &&
    isString(value.activityId) &&
    isNumber(value.setIndex) &&
    isNumber(value.value) &&
    (value.weightKg === undefined || isNumber(value.weightKg)) &&
    isString(value.startedAt) &&
    (value.endedAt === undefined || isString(value.endedAt)) &&
    isString(value.localDate) &&
    (value.durationSeconds === undefined || isNumber(value.durationSeconds)) &&
    (value.restSecondsAfter === undefined || isNumber(value.restSecondsAfter))
  );
};

const isCardioMetric = (value: unknown): value is WorkoutCardioMetric => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    (value.profileId === undefined || isString(value.profileId)) &&
    isString(value.workoutId) &&
    isString(value.activityId) &&
    isString(value.localDate) &&
    isNumber(value.distanceMeters) &&
    isNumber(value.durationSeconds) &&
    (value.averageSpeedKmh === undefined || isNumber(value.averageSpeedKmh)) &&
    (value.paceSecondsPerKm === undefined || isNumber(value.paceSecondsPerKm)) &&
    (value.inclinePercent === undefined || isNumber(value.inclinePercent)) &&
    (value.averageInclinePercent === undefined || isNumber(value.averageInclinePercent)) &&
    (value.maxInclinePercent === undefined || isNumber(value.maxInclinePercent)) &&
    (value.elevationGainMeters === undefined || isNumber(value.elevationGainMeters)) &&
    (value.averageHeartRate === undefined || isNumber(value.averageHeartRate)) &&
    (value.maxHeartRate === undefined || isNumber(value.maxHeartRate)) &&
    (value.perceivedEffort === undefined ||
      (isNumber(value.perceivedEffort) &&
        Number.isInteger(value.perceivedEffort) &&
        value.perceivedEffort >= 1 &&
        value.perceivedEffort <= 10)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isSummary = (value: unknown): value is DailyActivitySummary => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    (value.profileId === undefined || isString(value.profileId)) &&
    isString(value.localDate) &&
    isString(value.activityId) &&
    (value.activityType === "strength" ||
      value.activityType === "timed" ||
      value.activityType === "cardio") &&
    (value.totalReps === undefined || isNumber(value.totalReps)) &&
    (value.totalSeconds === undefined || isNumber(value.totalSeconds)) &&
    (value.totalDistanceMeters === undefined || isNumber(value.totalDistanceMeters)) &&
    (value.totalSets === undefined || isNumber(value.totalSets)) &&
    (value.bestSet === undefined || isNumber(value.bestSet)) &&
    (value.bestDistanceMeters === undefined || isNumber(value.bestDistanceMeters)) &&
    (value.bestPaceSecondsPerKm === undefined || isNumber(value.bestPaceSecondsPerKm)) &&
    (value.bestAverageSpeedKmh === undefined || isNumber(value.bestAverageSpeedKmh)) &&
    isNumber(value.totalDurationSeconds) &&
    isNumber(value.workoutCount) &&
    isString(value.updatedAt)
  );
};

const isSettings = (value: unknown): value is Settings => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.id === "settings" &&
    (value.profileId === undefined || isString(value.profileId)) &&
    value.language === "en" &&
    value.themeMode === "dark" &&
    (value.uiStyle === "neomorphism" ||
      value.uiStyle === "glassmorphism" ||
      value.uiStyle === "material" ||
      value.uiStyle === "ios") &&
    (value.colorMode === "dark" || value.colorMode === "light") &&
    isString(value.accentColor) &&
    (value.viewMode === undefined || value.viewMode === "basic" || value.viewMode === "advanced") &&
    (value.uiDensity === undefined ||
      value.uiDensity === "cozy" ||
      value.uiDensity === "compact") &&
    isString(value.defaultActivityId) &&
    isBoolean(value.soundEnabled) &&
    isBoolean(value.hapticsEnabled) &&
    isBoolean(value.countdownEnabled) &&
    value.weekStartsOn === "monday" &&
    isBoolean(value.onboardingCompleted) &&
    isString(value.displayName) &&
    isString(value.avatarId) &&
    (value.weightKg === undefined || isNumber(value.weightKg)) &&
    (value.heightCm === undefined || isNumber(value.heightCm)) &&
    (value.goalWeightKg === undefined || isNumber(value.goalWeightKg)) &&
    (value.appLanguage === undefined || value.appLanguage === "en" || value.appLanguage === "el") &&
    (value.adventureLanguage === undefined ||
      value.adventureLanguage === "same" ||
      value.adventureLanguage === "en" ||
      value.adventureLanguage === "el") &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isAchievement = (value: unknown): value is Achievement => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.slug) &&
    isString(value.title) &&
    isString(value.description) &&
    (value.category === undefined || isString(value.category)) &&
    (value.unlockedAt === undefined || isString(value.unlockedAt)) &&
    (value.activityId === undefined || isString(value.activityId)) &&
    (value.progressCurrent === undefined || isNumber(value.progressCurrent)) &&
    (value.progressTarget === undefined || isNumber(value.progressTarget)) &&
    (value.rewardXP === undefined || isNumber(value.rewardXP)) &&
    (value.rewardSkillPoints === undefined || isNumber(value.rewardSkillPoints))
  );
};

const isProgress = (value: unknown): value is UserProgress => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.id === "user" &&
    isNumber(value.totalXP) &&
    isNumber(value.level) &&
    isString(value.updatedAt)
  );
};

const isHeroProgress = (value: unknown): value is HeroProgress => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.id === "hero" &&
    (value.profileId === undefined || isString(value.profileId)) &&
    isString(value.heroName) &&
    isString(value.avatarId) &&
    isString(value.currentRegionId) &&
    isString(value.selectedRealmId) &&
    isNumber(value.currentHP) &&
    isNumber(value.maxHP) &&
    isNumber(value.unspentSkillPoints) &&
    isNumber(value.defeatedMobCount) &&
    isNumber(value.defeatedBossCount) &&
    isString(value.updatedAt)
  );
};

const isAdventureRegion = (value: unknown): value is AdventureRegion => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.story) &&
    isString(value.visualTone) &&
    isString(value.unlockRequirement) &&
    (value.status === undefined ||
      value.status === "locked" ||
      value.status === "unlocked" ||
      value.status === "completed") &&
    isBoolean(value.isUnlocked) &&
    isNumber(value.progress) &&
    isString(value.bossId)
  );
};

const isAdventureMob = (value: unknown): value is AdventureMob => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.slug) &&
    isString(value.title) &&
    isString(value.titleEl) &&
    isString(value.description) &&
    isString(value.descriptionEl) &&
    isString(value.realmId) &&
    (value.enemyType === "normal" || value.enemyType === "elite") &&
    isNumber(value.level) &&
    isNumber(value.maxHP) &&
    isNumber(value.currentHP) &&
    isNumber(value.attackPower) &&
    (value.weakness === "strength" || value.weakness === "timed" || value.weakness === "cardio") &&
    (value.status === "locked" ||
      value.status === "available" ||
      value.status === "selected" ||
      value.status === "defeated") &&
    isNumber(value.rewardXP) &&
    isNumber(value.rewardSkillPoints) &&
    (value.unlockedAt === undefined || isString(value.unlockedAt)) &&
    (value.selectedAt === undefined || isString(value.selectedAt)) &&
    (value.defeatedAt === undefined || isString(value.defeatedAt)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isAdventureMobRequirement = (value: unknown): value is AdventureMobRequirement => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.mobId) &&
    (value.activityId === undefined || isString(value.activityId)) &&
    (value.activitySlug === undefined || isString(value.activitySlug)) &&
    (value.activityType === undefined ||
      value.activityType === "strength" ||
      value.activityType === "timed" ||
      value.activityType === "cardio") &&
    (value.metric === "reps" ||
      value.metric === "seconds" ||
      value.metric === "distanceMeters" ||
      value.metric === "workouts" ||
      value.metric === "streak") &&
    isNumber(value.requiredValue) &&
    isNumber(value.currentValue) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isAdventureHitRequirement = (value: unknown): value is AdventureHitRequirement => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.enemyId) &&
    (value.activityId === undefined || isString(value.activityId)) &&
    (value.activitySlug === undefined || isString(value.activitySlug)) &&
    (value.activityType === undefined ||
      value.activityType === "strength" ||
      value.activityType === "timed" ||
      value.activityType === "cardio") &&
    (value.metric === "reps" || value.metric === "seconds" || value.metric === "distanceMeters") &&
    isNumber(value.requiredValue) &&
    isNumber(value.baseDamageValue) &&
    isString(value.displayLabel) &&
    isString(value.displayLabelEl)
  );
};

const isAdventureChest = (value: unknown): value is AdventureChest => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.slug) &&
    isString(value.title) &&
    isString(value.titleEl) &&
    isString(value.description) &&
    isString(value.descriptionEl) &&
    isString(value.realmId) &&
    (value.status === "locked" || value.status === "available" || value.status === "opened") &&
    isString(value.unlockRequirement) &&
    isString(value.unlockRequirementEl) &&
    isNumber(value.unlockCount) &&
    isNumber(value.rewardXP) &&
    isNumber(value.rewardSkillPoints) &&
    (value.openedAt === undefined || isString(value.openedAt)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isAdventureBoss = (value: unknown): value is AdventureBoss => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.slug) &&
    isString(value.title) &&
    isString(value.titleEl) &&
    isString(value.description) &&
    isString(value.descriptionEl) &&
    isString(value.regionId) &&
    (value.status === "locked" || value.status === "unlocked" || value.status === "defeated") &&
    isNumber(value.level) &&
    isNumber(value.maxHP) &&
    isNumber(value.currentHP) &&
    isNumber(value.attackPower) &&
    (value.weakness === "strength" || value.weakness === "timed" || value.weakness === "cardio") &&
    isString(value.unlockRequirement) &&
    isString(value.defeatRequirement) &&
    isNumber(value.defeatProgress) &&
    isNumber(value.defeatTarget) &&
    isNumber(value.rewardXP) &&
    isNumber(value.rewardSkillPoints) &&
    (value.rewardBadgeSlug === undefined || isString(value.rewardBadgeSlug)) &&
    (value.unlockedAt === undefined || isString(value.unlockedAt)) &&
    (value.defeatedAt === undefined || isString(value.defeatedAt)) &&
    isString(value.updatedAt)
  );
};

const isActiveAdventureTarget = (value: unknown): value is ActiveAdventureTarget => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.id === "active" &&
    (value.profileId === undefined || isString(value.profileId)) &&
    isString(value.realmId) &&
    (value.mobId === undefined || isString(value.mobId)) &&
    (value.bossId === undefined || isString(value.bossId)) &&
    isString(value.updatedAt)
  );
};

const isDraft = (value: unknown): value is ActiveWorkoutDraft => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.id === "active" &&
    (value.profileId === undefined || isString(value.profileId)) &&
    isString(value.activityId) &&
    (value.mode === "live" ||
      value.mode === "setEntry" ||
      value.mode === "timed" ||
      value.mode === "cardio") &&
    isString(value.startedAt) &&
    isString(value.localDate) &&
    isNumber(value.currentSetValue) &&
    Array.isArray(value.sets) &&
    value.sets.every(
      (set) =>
        isRecord(set) &&
        isString(set.id) &&
        isNumber(set.value) &&
        (set.weightKg === undefined || isNumber(set.weightKg))
    ) &&
    (value.cardioDistanceMeters === undefined || isNumber(value.cardioDistanceMeters)) &&
    (value.cardioDurationSeconds === undefined || isNumber(value.cardioDurationSeconds)) &&
    (value.cardioAverageSpeedKmh === undefined || isNumber(value.cardioAverageSpeedKmh)) &&
    (value.cardioInclinePercent === undefined || isNumber(value.cardioInclinePercent)) &&
    (value.cardioAverageHeartRate === undefined || isNumber(value.cardioAverageHeartRate)) &&
    (value.cardioMaxHeartRate === undefined || isNumber(value.cardioMaxHeartRate)) &&
    (value.cardioPerceivedEffort === undefined ||
      (isNumber(value.cardioPerceivedEffort) &&
        Number.isInteger(value.cardioPerceivedEffort) &&
        value.cardioPerceivedEffort >= 1 &&
        value.cardioPerceivedEffort <= 10)) &&
    (value.notes === undefined || isString(value.notes)) &&
    isString(value.updatedAt)
  );
};

const isTrainLog = (value: unknown): value is TrainLog => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.profileId) &&
    (value.workoutId === undefined || isString(value.workoutId)) &&
    isString(value.exerciseId) &&
    isString(value.exerciseName) &&
    (value.trackingType === "reps" ||
      value.trackingType === "seconds" ||
      value.trackingType === "distance" ||
      value.trackingType === "weight") &&
    (value.reps === undefined || isNumber(value.reps)) &&
    (value.durationSeconds === undefined || isNumber(value.durationSeconds)) &&
    (value.distanceMeters === undefined || isNumber(value.distanceMeters)) &&
    (value.weightKg === undefined || isNumber(value.weightKg)) &&
    (value.notes === undefined || isString(value.notes)) &&
    isNumber(value.xpAwarded) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const isAdventureProgress = (value: unknown): value is AdventureProgress => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.profileId) &&
    isString(value.selectedRealmId) &&
    (value.activeMobId === undefined || isString(value.activeMobId)) &&
    (value.activeBossId === undefined || isString(value.activeBossId)) &&
    Array.isArray(value.unlockedRealmIds) &&
    value.unlockedRealmIds.every(isString) &&
    Array.isArray(value.defeatedEnemyIds) &&
    value.defeatedEnemyIds.every(isString) &&
    Array.isArray(value.defeatedBossIds) &&
    value.defeatedBossIds.every(isString) &&
    Array.isArray(value.openedChestIds) &&
    value.openedChestIds.every(isString) &&
    isNumber(value.xpRewarded) &&
    isString(value.updatedAt)
  );
};

export const exportAppData = async (database: PenRepsDatabase = db): Promise<ExportPayload> => ({
  app: "Fit Quest",
  version: 1,
  exportedAt: nowIso(),
  profiles: await database.profiles.toArray(),
  profileHistory: await database.profileHistory.toArray(),
  appMeta: await database.appMeta.toArray(),
  activities: await database.activities.toArray(),
  trainLogs: await database.trainLogs.toArray(),
  adventureProgress: await database.adventureProgress.toArray(),
  workouts: await database.workouts.toArray(),
  workoutSets: await database.workoutSets.toArray(),
  workoutCardioMetrics: await database.workoutCardioMetrics.toArray(),
  dailySummaries: await database.dailySummaries.toArray(),
  settings: await database.settings.toArray(),
  achievements: await database.achievements.toArray(),
  userProgress: await database.userProgress.toArray(),
  heroProgress: await database.heroProgress.toArray(),
  heroSkills: await database.heroSkills.toArray(),
  adventureRegions: await database.adventureRegions.toArray(),
  adventureBosses: await database.adventureBosses.toArray(),
  adventureChests: await database.adventureChests.toArray(),
  adventureMobs: await database.adventureMobs.toArray(),
  adventureMobRequirements: await database.adventureMobRequirements.toArray(),
  adventureHitRequirements: await database.adventureHitRequirements.toArray(),
  adventureEvents: await database.adventureEvents.toArray(),
  activeAdventureTarget: await database.activeAdventureTarget.toArray(),
  activeWorkoutDraft: await database.activeWorkoutDraft.toArray()
});

export const stringifyExport = async (database: PenRepsDatabase = db) =>
  JSON.stringify(await exportAppData(database), null, 2);

export const validateImportPayload = (value: unknown): value is ExportPayload => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.app === "Fit Quest" || value.app === "Pan Reps") &&
    value.version === 1 &&
    isString(value.exportedAt) &&
    (value.profiles === undefined ||
      (Array.isArray(value.profiles) && value.profiles.every(isProfile))) &&
    (value.profileHistory === undefined ||
      (Array.isArray(value.profileHistory) && value.profileHistory.every(isProfileHistoryEntry))) &&
    (value.appMeta === undefined ||
      (Array.isArray(value.appMeta) && value.appMeta.every(isAppMeta))) &&
    Array.isArray(value.activities) &&
    value.activities.every(isActivity) &&
    (value.trainLogs === undefined ||
      (Array.isArray(value.trainLogs) && value.trainLogs.every(isTrainLog))) &&
    (value.adventureProgress === undefined ||
      (Array.isArray(value.adventureProgress) &&
        value.adventureProgress.every(isAdventureProgress))) &&
    Array.isArray(value.workouts) &&
    value.workouts.every(isWorkout) &&
    Array.isArray(value.workoutSets) &&
    value.workoutSets.every(isWorkoutSet) &&
    (value.workoutCardioMetrics === undefined ||
      (Array.isArray(value.workoutCardioMetrics) &&
        value.workoutCardioMetrics.every(isCardioMetric))) &&
    Array.isArray(value.dailySummaries) &&
    value.dailySummaries.every(isSummary) &&
    Array.isArray(value.settings) &&
    value.settings.every(isSettings) &&
    Array.isArray(value.achievements) &&
    value.achievements.every(isAchievement) &&
    Array.isArray(value.userProgress) &&
    value.userProgress.every(isProgress) &&
    (value.heroProgress === undefined ||
      (Array.isArray(value.heroProgress) && value.heroProgress.every(isHeroProgress))) &&
    (value.heroSkills === undefined || Array.isArray(value.heroSkills)) &&
    (value.adventureRegions === undefined ||
      (Array.isArray(value.adventureRegions) && value.adventureRegions.every(isAdventureRegion))) &&
    (value.adventureBosses === undefined ||
      (Array.isArray(value.adventureBosses) && value.adventureBosses.every(isAdventureBoss))) &&
    (value.adventureChests === undefined ||
      (Array.isArray(value.adventureChests) && value.adventureChests.every(isAdventureChest))) &&
    (value.adventureMobs === undefined ||
      (Array.isArray(value.adventureMobs) && value.adventureMobs.every(isAdventureMob))) &&
    (value.adventureMobRequirements === undefined ||
      (Array.isArray(value.adventureMobRequirements) &&
        value.adventureMobRequirements.every(isAdventureMobRequirement))) &&
    (value.adventureHitRequirements === undefined ||
      (Array.isArray(value.adventureHitRequirements) &&
        value.adventureHitRequirements.every(isAdventureHitRequirement))) &&
    (value.adventureEvents === undefined || Array.isArray(value.adventureEvents)) &&
    (value.activeAdventureTarget === undefined ||
      (Array.isArray(value.activeAdventureTarget) &&
        value.activeAdventureTarget.every(isActiveAdventureTarget))) &&
    Array.isArray(value.activeWorkoutDraft) &&
    value.activeWorkoutDraft.every(isDraft)
  );
};

export const parseImportJson = (json: string) => {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!validateImportPayload(parsed)) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
};

export const replaceAllData = async (payload: ExportPayload, database: PenRepsDatabase = db) => {
  await database.transaction(
    "rw",
    [
      database.profiles,
      database.profileHistory,
      database.appMeta,
      database.activities,
      database.trainLogs,
      database.adventureProgress,
      database.workouts,
      database.workoutSets,
      database.workoutCardioMetrics,
      database.dailySummaries,
      database.settings,
      database.achievements,
      database.userProgress,
      database.heroProgress,
      database.heroSkills,
      database.adventureRegions,
      database.adventureBosses,
      database.adventureChests,
      database.adventureMobs,
      database.adventureMobRequirements,
      database.adventureHitRequirements,
      database.adventureEvents,
      database.activeAdventureTarget,
      database.activeWorkoutDraft
    ],
    async () => {
      await Promise.all([
        database.profiles.clear(),
        database.profileHistory.clear(),
        database.appMeta.clear(),
        database.activities.clear(),
        database.trainLogs.clear(),
        database.adventureProgress.clear(),
        database.workouts.clear(),
        database.workoutSets.clear(),
        database.workoutCardioMetrics.clear(),
        database.dailySummaries.clear(),
        database.settings.clear(),
        database.achievements.clear(),
        database.userProgress.clear(),
        database.heroProgress.clear(),
        database.heroSkills.clear(),
        database.adventureRegions.clear(),
        database.adventureBosses.clear(),
        database.adventureChests.clear(),
        database.adventureMobs.clear(),
        database.adventureMobRequirements.clear(),
        database.adventureHitRequirements.clear(),
        database.adventureEvents.clear(),
        database.activeAdventureTarget.clear(),
        database.activeWorkoutDraft.clear()
      ]);
      await database.profiles.bulkPut(payload.profiles ?? []);
      await database.profileHistory.bulkPut(payload.profileHistory ?? []);
      await database.appMeta.bulkPut(payload.appMeta ?? []);
      await database.activities.bulkPut(payload.activities);
      await database.trainLogs.bulkPut(payload.trainLogs ?? []);
      await database.adventureProgress.bulkPut(payload.adventureProgress ?? []);
      await database.workouts.bulkPut(payload.workouts);
      await database.workoutSets.bulkPut(payload.workoutSets);
      await database.workoutCardioMetrics.bulkPut(payload.workoutCardioMetrics ?? []);
      await database.settings.bulkPut(payload.settings);
      await database.achievements.bulkPut(payload.achievements);
      await database.userProgress.bulkPut(payload.userProgress);
      await database.heroProgress.bulkPut(payload.heroProgress ?? []);
      await database.heroSkills.bulkPut(payload.heroSkills ?? []);
      await database.adventureRegions.bulkPut(payload.adventureRegions ?? []);
      await database.adventureBosses.bulkPut(payload.adventureBosses ?? []);
      await database.adventureChests.bulkPut(payload.adventureChests ?? []);
      await database.adventureMobs.bulkPut(payload.adventureMobs ?? []);
      await database.adventureMobRequirements.bulkPut(payload.adventureMobRequirements ?? []);
      await database.adventureHitRequirements.bulkPut(payload.adventureHitRequirements ?? []);
      await database.adventureEvents.bulkPut(payload.adventureEvents ?? []);
      await database.activeAdventureTarget.bulkPut(payload.activeAdventureTarget ?? []);
      await database.activeWorkoutDraft.bulkPut(payload.activeWorkoutDraft);
    }
  );

  await seedPredefinedActivities(database);
  await recalculateDailySummaries(database);
  await recalculateUserProgress(database);
  await recalculateAchievements(database);
  await recalculateAdventure(database);
};

export const resetAllData = async (database: PenRepsDatabase = db) => {
  await database.transaction(
    "rw",
    [
      database.profiles,
      database.profileHistory,
      database.appMeta,
      database.activities,
      database.trainLogs,
      database.adventureProgress,
      database.workouts,
      database.workoutSets,
      database.workoutCardioMetrics,
      database.dailySummaries,
      database.settings,
      database.achievements,
      database.userProgress,
      database.heroProgress,
      database.heroSkills,
      database.adventureRegions,
      database.adventureBosses,
      database.adventureChests,
      database.adventureMobs,
      database.adventureMobRequirements,
      database.adventureHitRequirements,
      database.adventureEvents,
      database.activeAdventureTarget,
      database.activeWorkoutDraft
    ],
    async () => {
      await Promise.all([
        database.profiles.clear(),
        database.profileHistory.clear(),
        database.appMeta.clear(),
        database.activities.clear(),
        database.trainLogs.clear(),
        database.adventureProgress.clear(),
        database.workouts.clear(),
        database.workoutSets.clear(),
        database.workoutCardioMetrics.clear(),
        database.dailySummaries.clear(),
        database.settings.clear(),
        database.achievements.clear(),
        database.userProgress.clear(),
        database.heroProgress.clear(),
        database.heroSkills.clear(),
        database.adventureRegions.clear(),
        database.adventureBosses.clear(),
        database.adventureChests.clear(),
        database.adventureMobs.clear(),
        database.adventureMobRequirements.clear(),
        database.adventureHitRequirements.clear(),
        database.adventureEvents.clear(),
        database.activeAdventureTarget.clear(),
        database.activeWorkoutDraft.clear()
      ]);
    }
  );

  await seedAppData(database);
  await recalculateDailySummaries(database);
  await recalculateUserProgress(database);
  await recalculateAchievements(database);
  await recalculateAdventure(database);
};
