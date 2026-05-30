import { DEFAULT_ACCENT } from "../utils/appIdentity";
import { getLevelFromXP } from "../utils/levels";
import type { PenRepsDatabase } from "./db";
import { db } from "./db";
import { seedAdventureData } from "./repositories/adventureRepo";
import { backfillProfileIdForLegacyData, ensureActiveProfile } from "./repositories/profilesRepo";
import type { Activity, Settings, UserProgress } from "./schema";

const seedCreatedAt = "2026-01-01T00:00:00.000Z";

export const DEFAULT_ACTIVITY_IDS = {
  pushups: "activity_pushups",
  pullups: "activity_pullups",
  situps: "activity_situps",
  squats: "activity_squats",
  treadmill: "activity_treadmill"
} as const;

export const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: DEFAULT_ACTIVITY_IDS.pushups,
    slug: "push-ups",
    name: "Push-ups",
    unit: "reps",
    activityType: "strength",
    icon: "Dumbbell",
    color: "#2563EB",
    defaultRestSeconds: 45,
    autoRestEnabled: false,
    dailyGoal: 0,
    weeklyGoal: 0,
    monthlyGoal: 0,
    yearlyGoal: 0,
    isDefault: true,
    isArchived: false,
    createdAt: seedCreatedAt,
    updatedAt: seedCreatedAt
  },
  {
    id: DEFAULT_ACTIVITY_IDS.pullups,
    slug: "pull-ups",
    name: "Pull-ups",
    unit: "reps",
    activityType: "strength",
    icon: "ArrowUp",
    color: "#22C55E",
    defaultRestSeconds: 45,
    autoRestEnabled: false,
    dailyGoal: 0,
    weeklyGoal: 0,
    monthlyGoal: 0,
    yearlyGoal: 0,
    isDefault: true,
    isArchived: false,
    createdAt: seedCreatedAt,
    updatedAt: seedCreatedAt
  },
  {
    id: DEFAULT_ACTIVITY_IDS.situps,
    slug: "sit-ups",
    name: "Sit-ups",
    unit: "reps",
    activityType: "strength",
    icon: "Activity",
    color: "#F59E0B",
    defaultRestSeconds: 45,
    autoRestEnabled: false,
    dailyGoal: 0,
    weeklyGoal: 0,
    monthlyGoal: 0,
    yearlyGoal: 0,
    isDefault: true,
    isArchived: false,
    createdAt: seedCreatedAt,
    updatedAt: seedCreatedAt
  },
  {
    id: DEFAULT_ACTIVITY_IDS.squats,
    slug: "squats",
    name: "Squats",
    unit: "reps",
    activityType: "strength",
    icon: "Zap",
    color: "#F43F5E",
    defaultRestSeconds: 45,
    autoRestEnabled: false,
    dailyGoal: 0,
    weeklyGoal: 0,
    monthlyGoal: 0,
    yearlyGoal: 0,
    isDefault: true,
    isArchived: false,
    createdAt: seedCreatedAt,
    updatedAt: seedCreatedAt
  },
  {
    id: DEFAULT_ACTIVITY_IDS.treadmill,
    slug: "treadmill",
    name: "Treadmill",
    unit: "distance",
    activityType: "cardio",
    icon: "Footprints",
    color: "#0891B2",
    defaultRestSeconds: 45,
    autoRestEnabled: false,
    dailyGoal: 0,
    weeklyGoal: 0,
    monthlyGoal: 0,
    yearlyGoal: 0,
    isDefault: true,
    isArchived: false,
    createdAt: seedCreatedAt,
    updatedAt: seedCreatedAt
  }
];

export const createDefaultSettings = (createdAt: string): Settings => ({
  id: "settings",
  language: "en",
  themeMode: "dark",
  uiStyle: "neomorphism",
  colorMode: "dark",
  accentColor: DEFAULT_ACCENT,
  viewMode: "basic",
  uiDensity: "cozy",
  defaultActivityId: DEFAULT_ACTIVITY_IDS.pushups,
  soundEnabled: true,
  hapticsEnabled: true,
  countdownEnabled: true,
  weekStartsOn: "monday",
  onboardingCompleted: false,
  displayName: "Player",
  avatarId: "default",
  appLanguage: "en",
  adventureLanguage: "same",
  createdAt,
  updatedAt: createdAt
});

export const createDefaultProgress = (updatedAt: string): UserProgress => ({
  id: "user",
  totalXP: 0,
  level: getLevelFromXP(0),
  updatedAt
});

export const seedPredefinedActivities = async (database: PenRepsDatabase = db) => {
  for (const activity of DEFAULT_ACTIVITIES) {
    const existingBySlug = await database.activities.where("slug").equals(activity.slug).first();
    const existingById = await database.activities.get(activity.id);

    if (!existingBySlug && !existingById) {
      await database.activities.add(activity);
    } else {
      const existing = existingById ?? existingBySlug;
      if (existing) {
        await database.activities.put({
          ...activity,
          ...existing,
          activityType: existing.activityType ?? activity.activityType,
          unit: existing.unit ?? activity.unit,
          isDefault: true
        });
      }
    }
  }
};

export const seedAppData = async (database: PenRepsDatabase = db) => {
  const now = new Date().toISOString();
  await seedPredefinedActivities(database);

  const settings = await database.settings.get("settings");
  if (!settings) {
    await database.settings.add(createDefaultSettings(now));
  }

  const progress = await database.userProgress.get("user");
  if (!progress) {
    await database.userProgress.add(createDefaultProgress(now));
  }

  const activeProfile = await ensureActiveProfile(database);
  await backfillProfileIdForLegacyData(activeProfile.id, database);
  await seedAdventureData(database);
};
