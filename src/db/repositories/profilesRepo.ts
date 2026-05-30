import { DEFAULT_ACCENT } from "../../utils/appIdentity";
import { nowIso } from "../../utils/dates";
import { createId } from "../../utils/ids";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type {
  AppLanguage,
  AppMeta,
  ColorMode,
  LocalProfile,
  Settings,
  UiDensity,
  UiStyle
} from "../schema";

const DEFAULT_PROFILE_NAME = "Player";
const CURRENT_SCHEMA_VERSION = 6;

const normalizeProfileName = (name?: string) => name?.trim() || DEFAULT_PROFILE_NAME;

const normalizeUiStyle = (value?: string): UiStyle =>
  value === "glassmorphism" || value === "material" ? value : "neomorphism";

const normalizeColorMode = (value?: string): ColorMode => (value === "light" ? "light" : "dark");

const normalizeUiDensity = (value?: string): UiDensity =>
  value === "compact" ? "compact" : "cozy";

const normalizeLanguage = (value?: string): AppLanguage => (value === "el" ? "el" : "en");

const createProfileFromSettings = (settings: Settings | undefined, timestamp: string) => {
  const profile: LocalProfile = {
    id: `profile_${createId()}`,
    name: normalizeProfileName(settings?.displayName),
    createdAt: timestamp,
    updatedAt: timestamp,
    selectedLanguage: normalizeLanguage(settings?.appLanguage ?? settings?.language),
    selectedTheme: {
      uiStyle: normalizeUiStyle(settings?.uiStyle),
      colorMode: normalizeColorMode(settings?.colorMode),
      accentColor: settings?.accentColor || DEFAULT_ACCENT,
      uiDensity: normalizeUiDensity(settings?.uiDensity)
    },
    onboardingCompleted: settings?.onboardingCompleted ?? false,
    active: true,
    lastUsedAt: timestamp
  };

  return profile;
};

const createMeta = (profileId: string, timestamp: string): AppMeta => ({
  id: "app",
  activeProfileId: profileId,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  createdAt: timestamp,
  updatedAt: timestamp
});

export const applyProfileToSettings = (settings: Settings, profile: LocalProfile): Settings => ({
  ...settings,
  profileId: profile.id,
  displayName: profile.name,
  appLanguage: profile.selectedLanguage,
  uiStyle: profile.selectedTheme.uiStyle,
  colorMode: profile.selectedTheme.colorMode,
  accentColor: profile.selectedTheme.accentColor,
  uiDensity: normalizeUiDensity(profile.selectedTheme.uiDensity),
  onboardingCompleted: settings.onboardingCompleted || profile.onboardingCompleted,
  updatedAt: nowIso()
});

export const listProfiles = async (database: PenRepsDatabase = db) =>
  (await database.profiles.orderBy("lastUsedAt").reverse().toArray()).map((profile) => ({
    ...profile,
    name: normalizeProfileName(profile.name)
  }));

export const ensureActiveProfile = async (
  database: PenRepsDatabase = db
): Promise<LocalProfile> => {
  const timestamp = nowIso();
  const [settings, meta, profiles] = await Promise.all([
    database.settings.get("settings"),
    database.appMeta.get("app"),
    database.profiles.toArray()
  ]);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const selected =
    (meta?.activeProfileId ? profileById.get(meta.activeProfileId) : undefined) ??
    profiles.find((profile) => profile.active) ??
    profiles.sort(
      (left, right) => new Date(right.lastUsedAt).getTime() - new Date(left.lastUsedAt).getTime()
    )[0];

  if (selected) {
    const normalized: LocalProfile = {
      ...selected,
      name: normalizeProfileName(selected.name),
      selectedLanguage: normalizeLanguage(selected.selectedLanguage),
      selectedTheme: {
        uiStyle: normalizeUiStyle(selected.selectedTheme?.uiStyle),
        colorMode: normalizeColorMode(selected.selectedTheme?.colorMode),
        accentColor: selected.selectedTheme?.accentColor || DEFAULT_ACCENT,
        uiDensity: normalizeUiDensity(selected.selectedTheme?.uiDensity)
      },
      onboardingCompleted: selected.onboardingCompleted ?? false,
      active: true,
      lastUsedAt: timestamp,
      updatedAt: timestamp
    };
    await database.transaction("rw", database.profiles, database.appMeta, async () => {
      await database.profiles.bulkPut(
        profiles.map((profile) => ({
          ...profile,
          active: profile.id === normalized.id,
          ...(profile.id === normalized.id
            ? {
                name: normalized.name,
                selectedLanguage: normalized.selectedLanguage,
                selectedTheme: normalized.selectedTheme,
                onboardingCompleted: normalized.onboardingCompleted,
                lastUsedAt: normalized.lastUsedAt,
                updatedAt: normalized.updatedAt
              }
            : {})
        }))
      );
      await database.appMeta.put({
        ...(meta ?? createMeta(normalized.id, timestamp)),
        activeProfileId: normalized.id,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        updatedAt: timestamp
      });
    });
    return normalized;
  }

  const created = createProfileFromSettings(settings, timestamp);
  await database.transaction("rw", database.profiles, database.appMeta, async () => {
    await database.profiles.add(created);
    await database.appMeta.put(createMeta(created.id, timestamp));
  });
  return created;
};

export const getActiveProfileId = async (database: PenRepsDatabase = db) =>
  (await ensureActiveProfile(database)).id;

export const createProfile = async (
  input: { name?: string } = {},
  database: PenRepsDatabase = db
) => {
  const timestamp = nowIso();
  const settings = await database.settings.get("settings");
  const profile: LocalProfile = {
    ...createProfileFromSettings(settings, timestamp),
    id: `profile_${createId()}`,
    name: normalizeProfileName(input.name),
    onboardingCompleted: settings?.onboardingCompleted ?? false,
    active: false,
    lastUsedAt: timestamp
  };

  await database.profiles.add(profile);
  return profile;
};

export const switchActiveProfile = async (profileId: string, database: PenRepsDatabase = db) => {
  const profile = await database.profiles.get(profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const timestamp = nowIso();
  const profiles = await database.profiles.toArray();
  const nextProfile: LocalProfile = {
    ...profile,
    name: normalizeProfileName(profile.name),
    active: true,
    lastUsedAt: timestamp,
    updatedAt: timestamp
  };
  const settings = await database.settings.get("settings");

  await database.transaction(
    "rw",
    database.profiles,
    database.appMeta,
    database.settings,
    async () => {
      await database.profiles.bulkPut(
        profiles.map((item) => (item.id === profileId ? nextProfile : { ...item, active: false }))
      );
      await database.appMeta.put(createMeta(profileId, timestamp));
      if (settings) {
        await database.settings.put(applyProfileToSettings(settings, nextProfile));
      }
    }
  );

  return nextProfile;
};

export const deleteProfile = async (profileId: string, database: PenRepsDatabase = db) => {
  const timestamp = nowIso();
  const profiles = await database.profiles.toArray();
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }
  if (profiles.length <= 1) {
    throw new Error("Cannot delete the only local profile.");
  }

  const replacement =
    profiles
      .filter((item) => item.id !== profileId)
      .sort(
        (left, right) => new Date(right.lastUsedAt).getTime() - new Date(left.lastUsedAt).getTime()
      )[0] ?? profiles.find((item) => item.id !== profileId);
  if (!replacement) {
    throw new Error("No replacement profile found.");
  }

  const settings = await database.settings.get("settings");
  const nextActive: LocalProfile = {
    ...replacement,
    name: normalizeProfileName(replacement.name),
    selectedLanguage: normalizeLanguage(replacement.selectedLanguage),
    selectedTheme: {
      uiStyle: normalizeUiStyle(replacement.selectedTheme?.uiStyle),
      colorMode: normalizeColorMode(replacement.selectedTheme?.colorMode),
      accentColor: replacement.selectedTheme?.accentColor || DEFAULT_ACCENT,
      uiDensity: normalizeUiDensity(replacement.selectedTheme?.uiDensity)
    },
    active: true,
    lastUsedAt: timestamp,
    updatedAt: timestamp
  };

  await database.transaction(
    "rw",
    [
      database.profiles,
      database.appMeta,
      database.settings,
      database.trainLogs,
      database.adventureProgress,
      database.workouts,
      database.workoutSets,
      database.workoutCardioMetrics,
      database.dailySummaries,
      database.adventureEvents,
      database.activeWorkoutDraft,
      database.heroProgress
    ],
    async () => {
      await Promise.all([
        database.trainLogs.where("profileId").equals(profileId).delete(),
        database.adventureProgress.where("profileId").equals(profileId).delete(),
        database.workouts.where("profileId").equals(profileId).delete(),
        database.workoutSets.where("profileId").equals(profileId).delete(),
        database.workoutCardioMetrics.where("profileId").equals(profileId).delete(),
        database.dailySummaries.where("profileId").equals(profileId).delete(),
        database.adventureEvents.where("profileId").equals(profileId).delete(),
        database.activeWorkoutDraft.where("profileId").equals(profileId).delete(),
        database.heroProgress.where("profileId").equals(profileId).delete()
      ]);
      await database.profiles.delete(profileId);
      await database.profiles.bulkPut(
        profiles
          .filter((item) => item.id !== profileId)
          .map((item) => (item.id === nextActive.id ? nextActive : { ...item, active: false }))
      );
      await database.appMeta.put(createMeta(nextActive.id, timestamp));
      if (settings) {
        await database.settings.put(applyProfileToSettings(settings, nextActive));
      }
    }
  );

  return nextActive;
};

export const updateActiveProfile = async (
  updates: {
    name?: string;
    selectedLanguage?: AppLanguage;
    selectedTheme?: Partial<LocalProfile["selectedTheme"]>;
    onboardingCompleted?: boolean;
  },
  database: PenRepsDatabase = db
) => {
  const current = await ensureActiveProfile(database);
  const timestamp = nowIso();
  const next: LocalProfile = {
    ...current,
    ...(updates.name !== undefined ? { name: normalizeProfileName(updates.name) } : {}),
    ...(updates.selectedLanguage !== undefined
      ? { selectedLanguage: updates.selectedLanguage }
      : {}),
    selectedTheme: {
      ...current.selectedTheme,
      ...(updates.selectedTheme?.uiStyle !== undefined
        ? { uiStyle: updates.selectedTheme.uiStyle }
        : {}),
      ...(updates.selectedTheme?.colorMode !== undefined
        ? { colorMode: updates.selectedTheme.colorMode }
        : {}),
      ...(updates.selectedTheme?.accentColor !== undefined
        ? { accentColor: updates.selectedTheme.accentColor }
        : {}),
      ...(updates.selectedTheme?.uiDensity !== undefined
        ? { uiDensity: updates.selectedTheme.uiDensity }
        : {})
    },
    ...(updates.onboardingCompleted !== undefined
      ? { onboardingCompleted: updates.onboardingCompleted }
      : {}),
    active: true,
    lastUsedAt: timestamp,
    updatedAt: timestamp
  };

  await database.profiles.put(next);
  return next;
};

export const syncActiveProfileFromSettings = async (
  settings: Settings,
  database: PenRepsDatabase = db
) => {
  const selectedThemeUpdates: Partial<LocalProfile["selectedTheme"]> = {
    uiStyle: settings.uiStyle,
    colorMode: settings.colorMode,
    accentColor: settings.accentColor,
    uiDensity: settings.uiDensity
  };
  await updateActiveProfile(
    {
      name: settings.displayName,
      selectedLanguage: settings.appLanguage,
      selectedTheme: selectedThemeUpdates,
      onboardingCompleted: settings.onboardingCompleted
    },
    database
  );
};

export const backfillProfileIdForLegacyData = async (
  profileId: string,
  database: PenRepsDatabase = db
) => {
  const [workouts, sets, cardioMetrics, summaries, events, drafts] = await Promise.all([
    database.workouts.toArray(),
    database.workoutSets.toArray(),
    database.workoutCardioMetrics.toArray(),
    database.dailySummaries.toArray(),
    database.adventureEvents.toArray(),
    database.activeWorkoutDraft.toArray()
  ]);

  await database.transaction(
    "rw",
    [
      database.workouts,
      database.workoutSets,
      database.workoutCardioMetrics,
      database.dailySummaries,
      database.adventureEvents,
      database.activeWorkoutDraft
    ],
    async () => {
      await Promise.all([
        database.workouts.bulkPut(
          workouts.map((item) => (item.profileId ? item : { ...item, profileId }))
        ),
        database.workoutSets.bulkPut(
          sets.map((item) => (item.profileId ? item : { ...item, profileId }))
        ),
        database.workoutCardioMetrics.bulkPut(
          cardioMetrics.map((item) => (item.profileId ? item : { ...item, profileId }))
        ),
        database.dailySummaries.bulkPut(
          summaries.map((item) => (item.profileId ? item : { ...item, profileId }))
        ),
        database.adventureEvents.bulkPut(
          events.map((item) => (item.profileId ? item : { ...item, profileId }))
        ),
        database.activeWorkoutDraft.bulkPut(
          drafts.map((item) => (item.profileId ? item : { ...item, profileId }))
        )
      ]);
    }
  );
};
