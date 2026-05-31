import { DEFAULT_ACCENT } from "../../utils/appIdentity";
import { nowIso, toLocalDate } from "../../utils/dates";
import { createId } from "../../utils/ids";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { HealthLog, HealthTask } from "../schema";
import { getActiveProfileId } from "./profilesRepo";

const WATER_TASK_ID = "health_water";

export const DEFAULT_HEALTH_TASKS: HealthTask[] = [
  {
    id: WATER_TASK_ID,
    slug: "daily-water",
    name: "Daily water",
    unit: "milliliters",
    cadence: "daily",
    dailyGoal: 3000,
    icon: "Droplets",
    color: DEFAULT_ACCENT,
    isDefault: true,
    isArchived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

export const seedHealthTasks = async (database: PenRepsDatabase = db) => {
  for (const task of DEFAULT_HEALTH_TASKS) {
    const existing = await database.healthTasks.get(task.id);
    if (!existing) {
      await database.healthTasks.add(task);
      continue;
    }
    await database.healthTasks.put({
      ...task,
      ...existing,
      unit: task.unit,
      cadence: task.cadence,
      isDefault: true,
      dailyGoal: existing.dailyGoal || task.dailyGoal
    });
  }
};

export const listHealthTasks = async (database: PenRepsDatabase = db) => {
  await seedHealthTasks(database);
  return (await database.healthTasks.toArray()).filter((task) => !task.isArchived);
};

export const createHealthTask = async (
  input: { name: string; dailyGoal: number; color?: string },
  database: PenRepsDatabase = db
): Promise<HealthTask> => {
  const timestamp = nowIso();
  const baseSlug =
    input.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "health-task";
  let slug = baseSlug;
  let suffix = 2;
  while (await database.healthTasks.where("slug").equals(slug).first()) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  const task: HealthTask = {
    id: createId(),
    slug,
    name: input.name.trim() || "Health task",
    unit: "milliliters",
    cadence: "daily",
    dailyGoal: Math.max(1, Math.round(input.dailyGoal)),
    icon: "Droplets",
    color: input.color ?? DEFAULT_ACCENT,
    isDefault: false,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await database.healthTasks.add(task);
  return task;
};

export const listHealthLogsForDate = async (
  localDate = toLocalDate(),
  database: PenRepsDatabase = db
) => {
  const profileId = await getActiveProfileId(database);
  return database.healthLogs
    .where("[profileId+localDate]")
    .equals([profileId, localDate])
    .toArray();
};

export const addHealthLog = async (
  input: { taskId: string; value: number; localDate?: string; notes?: string },
  database: PenRepsDatabase = db
): Promise<HealthLog> => {
  const profileId = await getActiveProfileId(database);
  const timestamp = nowIso();
  const log: HealthLog = {
    id: createId(),
    profileId,
    taskId: input.taskId,
    localDate: input.localDate ?? toLocalDate(timestamp),
    value: Math.max(0, Math.round(input.value)),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await database.healthLogs.add(log);
  return log;
};
