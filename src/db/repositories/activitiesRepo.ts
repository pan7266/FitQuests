import { DEFAULT_ACCENT } from "../../utils/appIdentity";
import { nowIso } from "../../utils/dates";
import { createId } from "../../utils/ids";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { Activity, ActivityUnit } from "../schema";
import { DEFAULT_ACTIVITIES, seedPredefinedActivities } from "../seed";
import { recalculateAchievements } from "./achievementsRepo";
import { recalculateAdventure } from "./adventureRepo";

export interface CreateCustomActivityInput {
  name: string;
  unit: ActivityUnit;
  icon?: string;
  color?: string;
  defaultRestSeconds?: number;
  autoRestEnabled?: boolean;
  dailyGoal?: number;
  weeklyGoal?: number;
  monthlyGoal?: number;
  yearlyGoal?: number;
}

export type ActivityUpdate = Partial<
  Pick<
    Activity,
    | "name"
    | "icon"
    | "color"
    | "activityType"
    | "defaultRestSeconds"
    | "autoRestEnabled"
    | "dailyGoal"
    | "weeklyGoal"
    | "monthlyGoal"
    | "yearlyGoal"
    | "isArchived"
  >
>;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const makeUniqueSlug = async (baseName: string, database: PenRepsDatabase) => {
  const baseSlug = slugify(baseName) || "custom-activity";
  let slug = baseSlug;
  let suffix = 2;

  while (await database.activities.where("slug").equals(slug).first()) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

export const ensureSeedActivities = async (database: PenRepsDatabase = db) =>
  seedPredefinedActivities(database);

export const listActivities = async (
  options: { includeArchived?: boolean } = {},
  database: PenRepsDatabase = db
) => {
  await ensureSeedActivities(database);
  const activities = (await database.activities.toArray()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );

  if (options.includeArchived) {
    return activities;
  }

  return activities.filter((activity) => !activity.isArchived);
};

export const getActivity = async (id: string, database: PenRepsDatabase = db) => {
  await ensureSeedActivities(database);
  return database.activities.get(id);
};

export const getDefaultActivity = async (database: PenRepsDatabase = db) => {
  await ensureSeedActivities(database);
  const firstDefault = await database.activities.get(DEFAULT_ACTIVITIES[0].id);

  if (!firstDefault) {
    throw new Error("Default activity seed failed.");
  }

  return firstDefault;
};

export const createCustomActivity = async (
  input: CreateCustomActivityInput,
  database: PenRepsDatabase = db
): Promise<Activity> => {
  const now = nowIso();
  const activity: Activity = {
    id: createId(),
    slug: await makeUniqueSlug(input.name, database),
    name: input.name.trim() || "Custom Activity",
    unit: input.unit,
    activityType:
      input.unit === "seconds"
        ? "timed"
        : input.unit === "distance"
          ? "cardio"
          : input.unit === "milliliters"
            ? "health"
            : "strength",
    icon:
      input.icon ??
      (input.unit === "seconds"
        ? "Timer"
        : input.unit === "weight"
          ? "Dumbbell"
          : input.unit === "milliliters"
            ? "Droplets"
            : "Plus"),
    color: input.color ?? DEFAULT_ACCENT,
    defaultRestSeconds: Math.max(1, Math.floor(input.defaultRestSeconds ?? 45)),
    autoRestEnabled: input.autoRestEnabled ?? false,
    dailyGoal: Math.max(0, Math.floor(input.dailyGoal ?? 0)),
    weeklyGoal: Math.max(0, Math.floor(input.weeklyGoal ?? 0)),
    monthlyGoal: Math.max(0, Math.floor(input.monthlyGoal ?? 0)),
    yearlyGoal: Math.max(0, Math.floor(input.yearlyGoal ?? 0)),
    isDefault: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now
  };

  await database.activities.add(activity);
  await recalculateAchievements(database);
  await recalculateAdventure(database);

  return activity;
};

export const updateActivity = async (
  id: string,
  updates: ActivityUpdate,
  database: PenRepsDatabase = db
) => {
  const existing = await database.activities.get(id);

  if (!existing) {
    throw new Error("Activity not found.");
  }

  const next: Activity = {
    ...existing,
    ...updates,
    id: existing.id,
    slug: existing.slug,
    unit: existing.unit,
    isDefault: existing.isDefault,
    defaultRestSeconds: Math.max(
      1,
      Math.floor(updates.defaultRestSeconds ?? existing.defaultRestSeconds)
    ),
    dailyGoal: Math.max(0, Math.floor(updates.dailyGoal ?? existing.dailyGoal)),
    weeklyGoal: Math.max(0, Math.floor(updates.weeklyGoal ?? existing.weeklyGoal)),
    monthlyGoal: Math.max(0, Math.floor(updates.monthlyGoal ?? existing.monthlyGoal)),
    yearlyGoal: Math.max(0, Math.floor(updates.yearlyGoal ?? existing.yearlyGoal)),
    updatedAt: nowIso()
  };

  await database.activities.put(next);
  await recalculateAchievements(database);
  await recalculateAdventure(database);

  return next;
};

export const archiveCustomActivity = async (id: string, database: PenRepsDatabase = db) => {
  const activity = await database.activities.get(id);

  if (!activity) {
    throw new Error("Activity not found.");
  }

  if (activity.isDefault) {
    throw new Error("Default activities cannot be archived.");
  }

  return updateActivity(id, { isArchived: true }, database);
};
