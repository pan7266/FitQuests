import { nowIso } from "../../utils/dates";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { Settings } from "../schema";
import { createDefaultSettings, DEFAULT_ACTIVITY_IDS } from "../seed";
import {
  applyProfileToSettings,
  ensureActiveProfile,
  syncActiveProfileFromSettings
} from "./profilesRepo";

export type SettingsUpdate = Partial<
  Pick<
    Settings,
    | "uiStyle"
    | "colorMode"
    | "accentColor"
    | "viewMode"
    | "uiDensity"
    | "defaultActivityId"
    | "soundEnabled"
    | "hapticsEnabled"
    | "countdownEnabled"
    | "onboardingCompleted"
    | "displayName"
    | "avatarId"
    | "weightKg"
    | "heightCm"
    | "goalWeightKg"
    | "appLanguage"
    | "adventureLanguage"
  >
>;

const normalizeSettings = (settings: Settings): Settings => {
  const legacyUiStyle = settings.uiStyle as string;
  const existingDisplayName = settings.displayName?.trim();
  const uiStyle =
    legacyUiStyle === "ios"
      ? "ios"
      : legacyUiStyle === "material"
        ? "material"
        : legacyUiStyle === "glassmorphism"
          ? "glassmorphism"
          : "neomorphism";

  return {
    ...settings,
    uiStyle,
    colorMode: settings.colorMode ?? (legacyUiStyle === "white" ? "light" : "dark"),
    displayName:
      !existingDisplayName || existingDisplayName === "You" ? "Player" : existingDisplayName,
    avatarId: settings.avatarId || "default",
    viewMode: settings.viewMode ?? "basic",
    uiDensity: settings.uiDensity ?? "cozy",
    ...(settings.weightKg !== undefined ? { weightKg: settings.weightKg } : {}),
    ...(settings.heightCm !== undefined ? { heightCm: settings.heightCm } : {}),
    ...(settings.goalWeightKg !== undefined ? { goalWeightKg: settings.goalWeightKg } : {}),
    appLanguage: settings.appLanguage ?? settings.language ?? "en",
    adventureLanguage: settings.adventureLanguage ?? "same"
  };
};

export const getSettings = async (database: PenRepsDatabase = db): Promise<Settings> => {
  const existing = await database.settings.get("settings");

  if (existing) {
    const profile = await ensureActiveProfile(database);
    const normalized = applyProfileToSettings(normalizeSettings(existing), profile);
    if (JSON.stringify(normalized) !== JSON.stringify(existing)) {
      await database.settings.put(normalized);
    }
    return normalized;
  }

  const createdAt = nowIso();
  const profile = await ensureActiveProfile(database);
  const settings = applyProfileToSettings(createDefaultSettings(createdAt), profile);
  await database.settings.put(settings);

  return settings;
};

export const updateSettings = async (
  updates: SettingsUpdate,
  database: PenRepsDatabase = db
): Promise<Settings> => {
  const current = await getSettings(database);
  const next: Settings = {
    ...current,
    ...updates,
    id: "settings",
    language: "en",
    themeMode: "dark",
    weekStartsOn: "monday",
    displayName:
      updates.displayName !== undefined
        ? updates.displayName.trim() || "Player"
        : current.displayName,
    updatedAt: nowIso()
  };

  await database.settings.put(next);
  await syncActiveProfileFromSettings(next, database);
  return next;
};

export const resetSettingsForFreshData = async (database: PenRepsDatabase = db) => {
  const now = nowIso();
  const profile = await ensureActiveProfile(database);
  const settings = applyProfileToSettings(createDefaultSettings(now), profile);
  settings.defaultActivityId = DEFAULT_ACTIVITY_IDS.pushups;
  await database.settings.put(settings);
  await syncActiveProfileFromSettings(settings, database);
  return settings;
};
