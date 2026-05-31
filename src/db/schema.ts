export type ActivityUnit = "reps" | "seconds" | "distance" | "weight" | "milliliters";
export type ActivityType = "strength" | "timed" | "cardio" | "health";
export type WorkoutMode = "live" | "setEntry" | "timed" | "cardio";
export type UiStyle = "neomorphism" | "glassmorphism" | "material" | "ios";
export type ColorMode = "dark" | "light";
export type ViewMode = "basic" | "advanced";
export type UiDensity = "cozy" | "compact";
export type WeekStartsOn = "monday";
export type AppLanguage = "en" | "el";
export type AdventureLanguage = "same" | "en" | "el";
export type BossStatus = "locked" | "unlocked" | "defeated";
export type RealmStatus = "locked" | "unlocked" | "completed";
export type MobStatus = "locked" | "available" | "selected" | "defeated";
export type AdventureEnemyType = "normal" | "elite";
export type ChestStatus = "locked" | "available" | "opened";
export type MobRequirementMetric = "reps" | "seconds" | "distanceMeters" | "workouts" | "streak";
export type AdventureHitMetric = "reps" | "seconds" | "distanceMeters";
export type AdventureEventType =
  | "mob_damaged"
  | "mob_defeated"
  | "mob_selected"
  | "chest_opened"
  | "boss_unlocked"
  | "boss_defeated"
  | "region_unlocked"
  | "skill_upgraded";
export type HeroSkillSlug = "power" | "endurance" | "focus" | "agility" | "luck" | "life";
export type PerceivedEffort = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface LocalProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  selectedLanguage: AppLanguage;
  selectedTheme: {
    uiStyle: UiStyle;
    colorMode: ColorMode;
    accentColor: string;
    uiDensity: UiDensity;
  };
  onboardingCompleted: boolean;
  active: boolean;
  lastUsedAt: string;
}

export interface ProfileHistoryEntry {
  id: string;
  profileId: string;
  field: "displayName" | "weightKg" | "heightCm" | "goalWeightKg";
  previousValue?: string;
  nextValue?: string;
  createdAt: string;
}

export interface AppMeta {
  id: "app";
  activeProfileId: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type HealthTaskUnit = "milliliters";
export type HealthTaskCadence = "daily";

export interface HealthTask {
  id: string;
  slug: string;
  name: string;
  unit: HealthTaskUnit;
  cadence: HealthTaskCadence;
  dailyGoal: number;
  icon: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HealthLog {
  id: string;
  profileId: string;
  taskId: string;
  localDate: string;
  value: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory = "bodyweight" | "cardio" | "weights" | "mobility" | "accessory";

export interface UserEquipmentInventoryItem {
  id: string;
  profileId: string;
  equipmentKey: string;
  name: string;
  category: EquipmentCategory;
  isOwned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  slug: string;
  name: string;
  unit: ActivityUnit;
  activityType: ActivityType;
  icon: string;
  color: string;
  defaultRestSeconds: number;
  autoRestEnabled: boolean;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  yearlyGoal: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workout {
  id: string;
  profileId?: string;
  activityId: string;
  startedAt: string;
  endedAt?: string;
  localDate: string;
  durationSeconds: number;
  mode: WorkoutMode;
  notes?: string;
  xpAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  profileId?: string;
  workoutId: string;
  activityId: string;
  setIndex: number;
  value: number;
  weightKg?: number;
  startedAt: string;
  endedAt?: string;
  localDate: string;
  durationSeconds?: number;
  restSecondsAfter?: number;
}

export interface DailyActivitySummary {
  id: string;
  profileId?: string;
  localDate: string;
  activityId: string;
  activityType: ActivityType;
  totalReps?: number;
  totalSeconds?: number;
  totalDistanceMeters?: number;
  totalSets?: number;
  totalDurationSeconds: number;
  workoutCount: number;
  bestSet?: number;
  bestDistanceMeters?: number;
  bestPaceSecondsPerKm?: number;
  bestAverageSpeedKmh?: number;
  updatedAt: string;
}

export interface Settings {
  id: "settings";
  profileId?: string;
  language: "en";
  themeMode: "dark";
  uiStyle: UiStyle;
  colorMode: ColorMode;
  accentColor: string;
  viewMode: ViewMode;
  uiDensity: UiDensity;
  defaultActivityId: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  countdownEnabled: boolean;
  weekStartsOn: WeekStartsOn;
  onboardingCompleted: boolean;
  displayName: string;
  avatarId: string;
  weightKg?: number;
  heightCm?: number;
  goalWeightKg?: number;
  appLanguage: AppLanguage;
  adventureLanguage: AdventureLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  unlockedAt?: string;
  activityId?: string;
  progressCurrent?: number;
  progressTarget?: number;
  rewardXP?: number;
  rewardSkillPoints?: number;
}

export interface UserProgress {
  id: "user";
  totalXP: number;
  level: number;
  updatedAt: string;
}

export interface WorkoutCardioMetric {
  id: string;
  profileId?: string;
  workoutId: string;
  activityId: string;
  localDate: string;
  distanceMeters: number;
  durationSeconds: number;
  averageSpeedKmh?: number;
  paceSecondsPerKm?: number;
  inclinePercent?: number;
  averageInclinePercent?: number;
  maxInclinePercent?: number;
  elevationGainMeters?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  perceivedEffort?: PerceivedEffort;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSkill {
  id: string;
  slug: HeroSkillSlug;
  name: string;
  description: string;
  level: number;
  icon: string;
  updatedAt: string;
}

export interface HeroProgress {
  id: "hero";
  profileId?: string;
  heroName: string;
  avatarId: string;
  currentRegionId: string;
  selectedRealmId: string;
  currentHP: number;
  maxHP: number;
  unspentSkillPoints: number;
  defeatedMobCount: number;
  defeatedBossCount: number;
  updatedAt: string;
}

export interface AdventureRegion {
  id: string;
  title: string;
  description: string;
  story: string;
  visualTone: string;
  unlockRequirement: string;
  status: RealmStatus;
  isUnlocked: boolean;
  progress: number;
  bossId: string;
}

export interface AdventureMob {
  id: string;
  slug: string;
  title: string;
  titleEl: string;
  description: string;
  descriptionEl: string;
  realmId: string;
  enemyType: AdventureEnemyType;
  level: number;
  maxHP: number;
  currentHP: number;
  attackPower: number;
  weakness: ActivityType;
  status: MobStatus;
  rewardXP: number;
  rewardSkillPoints: number;
  unlockedAt?: string;
  selectedAt?: string;
  defeatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdventureMobRequirement {
  id: string;
  mobId: string;
  activityId?: string;
  activitySlug?: string;
  activityType?: ActivityType;
  metric: MobRequirementMetric;
  requiredValue: number;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdventureHitRequirement {
  id: string;
  enemyId: string;
  activityId?: string;
  activitySlug?: string;
  activityType?: ActivityType;
  metric: AdventureHitMetric;
  requiredValue: number;
  baseDamageValue: number;
  displayLabel: string;
  displayLabelEl: string;
}

export interface AdventureChest {
  id: string;
  slug: string;
  title: string;
  titleEl: string;
  description: string;
  descriptionEl: string;
  realmId: string;
  status: ChestStatus;
  unlockRequirement: string;
  unlockRequirementEl: string;
  unlockCount: number;
  rewardXP: number;
  rewardSkillPoints: number;
  openedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveAdventureTarget {
  id: "active";
  realmId: string;
  mobId?: string;
  bossId?: string;
  updatedAt: string;
}

export interface AdventureBoss {
  id: string;
  slug: string;
  title: string;
  description: string;
  titleEl: string;
  descriptionEl: string;
  regionId: string;
  status: BossStatus;
  level: number;
  maxHP: number;
  currentHP: number;
  attackPower: number;
  weakness: ActivityType;
  unlockRequirement: string;
  defeatRequirement: string;
  defeatProgress: number;
  defeatTarget: number;
  rewardXP: number;
  rewardSkillPoints: number;
  rewardBadgeSlug?: string;
  unlockedAt?: string;
  defeatedAt?: string;
  updatedAt: string;
}

export interface AdventureEvent {
  id: string;
  profileId?: string;
  type: AdventureEventType;
  title: string;
  description: string;
  localDate: string;
  createdAt: string;
}

export interface RestTimerState {
  startedAt: string;
  targetEndAt: string;
  durationSeconds: number;
}

export interface ActiveWorkoutSetDraft {
  id: string;
  profileId?: string;
  activityId: string;
  setIndex: number;
  value: number;
  weightKg?: number;
  startedAt: string;
  endedAt?: string;
  localDate: string;
  durationSeconds?: number;
  restSecondsAfter?: number;
}

export interface ActiveWorkoutDraft {
  id: "active";
  profileId?: string;
  activityId: string;
  mode: WorkoutMode;
  startedAt: string;
  localDate: string;
  currentSetValue: number;
  sets: ActiveWorkoutSetDraft[];
  restTimer?: RestTimerState;
  cardioDistanceMeters?: number;
  cardioDurationSeconds?: number;
  cardioAverageSpeedKmh?: number;
  cardioInclinePercent?: number;
  cardioAverageHeartRate?: number;
  cardioMaxHeartRate?: number;
  cardioPerceivedEffort?: PerceivedEffort;
  cardioTimerStartedAt?: string;
  cardioAccumulatedSeconds?: number;
  notes?: string;
  updatedAt: string;
}

export interface CompletedWorkoutInput {
  activityId: string;
  startedAt: string;
  endedAt: string;
  localDate: string;
  mode: WorkoutMode;
  notes?: string;
  sets: Omit<WorkoutSet, "workoutId">[];
}

export interface TrainLog {
  id: string;
  profileId: string;
  workoutId?: string;
  exerciseId: string;
  exerciseName: string;
  trackingType: ActivityUnit;
  reps?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  weightKg?: number;
  notes?: string;
  xpAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdventureProgress {
  id: string;
  profileId: string;
  selectedRealmId: string;
  activeMobId?: string;
  activeBossId?: string;
  unlockedRealmIds: string[];
  defeatedEnemyIds: string[];
  defeatedBossIds: string[];
  openedChestIds: string[];
  xpRewarded: number;
  updatedAt: string;
}

export interface ExportPayload {
  app: "Fit Quest";
  version: 1;
  exportedAt: string;
  profiles: LocalProfile[];
  profileHistory: ProfileHistoryEntry[];
  appMeta: AppMeta[];
  healthTasks: HealthTask[];
  healthLogs: HealthLog[];
  userEquipmentInventory: UserEquipmentInventoryItem[];
  activities: Activity[];
  trainLogs: TrainLog[];
  adventureProgress: AdventureProgress[];
  workouts: Workout[];
  workoutSets: WorkoutSet[];
  workoutCardioMetrics: WorkoutCardioMetric[];
  dailySummaries: DailyActivitySummary[];
  settings: Settings[];
  achievements: Achievement[];
  userProgress: UserProgress[];
  heroProgress: HeroProgress[];
  heroSkills: HeroSkill[];
  adventureRegions: AdventureRegion[];
  adventureBosses: AdventureBoss[];
  adventureMobs: AdventureMob[];
  adventureMobRequirements: AdventureMobRequirement[];
  adventureHitRequirements: AdventureHitRequirement[];
  adventureChests: AdventureChest[];
  adventureEvents: AdventureEvent[];
  activeAdventureTarget: ActiveAdventureTarget[];
  activeWorkoutDraft: ActiveWorkoutDraft[];
}
