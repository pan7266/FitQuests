import { Download, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccentColorControl } from "../../components/controls/AccentColorControl";
import { ThemeSelector } from "../../components/controls/ThemeSelector";
import { ToggleSwitch } from "../../components/controls/ToggleSwitch";
import { NeomorphicButton } from "../../components/neumorphic/NeomorphicButton";
import { AVATAR_OPTIONS } from "../../components/profile/avatarOptions";
import { ProfileHeroSection } from "../../components/profile/ProfileHeroSection";
import {
  archiveCustomActivity,
  createCustomActivity,
  listActivities,
  updateActivity
} from "../../db/repositories/activitiesRepo";
import { listAdventureState } from "../../db/repositories/adventureRepo";
import {
  createProfile,
  deleteProfile,
  listProfiles,
  switchActiveProfile
} from "../../db/repositories/profilesRepo";
import { getUserProgress, recalculateUserProgress } from "../../db/repositories/progressRepo";
import { listSummaries, recalculateDailySummaries } from "../../db/repositories/summariesRepo";
import { listWorkouts } from "../../db/repositories/workoutsRepo";
import type {
  Activity,
  ActivityUnit,
  AdventureRegion,
  DailyActivitySummary,
  HeroProgress,
  LocalProfile,
  UserProgress,
  Workout
} from "../../db/schema";
import { useSettingsStore } from "../../stores/settingsStore";
import { APP_NAME, DEFAULT_ACCENT } from "../../utils/appIdentity";
import {
  parseImportJson,
  replaceAllData,
  resetAllData,
  stringifyExport
} from "../../utils/exportImport";
import { translate } from "../../utils/i18n";
import { calculateStreaks } from "../../utils/streaks";

interface HeroStats {
  progress: UserProgress;
  workouts: Workout[];
  summaries: DailyActivitySummary[];
  adventureHero?: HeroProgress | undefined;
  adventureRegions: AdventureRegion[];
}

export function SettingsScreen() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState<ActivityUnit>("reps");
  const [status, setStatus] = useState("");
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [heroStats, setHeroStats] = useState<HeroStats>({
    progress: { id: "user", totalXP: 0, level: 1, updatedAt: "" },
    workouts: [],
    summaries: [],
    adventureHero: undefined,
    adventureRegions: []
  });
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const t = (key: string) => translate(settings?.appLanguage ?? "en", key);

  const loadActivities = useCallback(async () => {
    setActivities(await listActivities({ includeArchived: true }));
  }, []);

  const loadHeroStats = useCallback(async () => {
    const [progress, workouts, summaries, adventure] = await Promise.all([
      getUserProgress(),
      listWorkouts(),
      listSummaries(),
      listAdventureState()
    ]);
    setHeroStats({
      progress,
      workouts,
      summaries,
      adventureHero: adventure.hero,
      adventureRegions: adventure.regions
    });
  }, []);

  const loadProfiles = useCallback(async () => {
    setProfiles(await listProfiles());
  }, []);

  useEffect(() => {
    void loadActivities();
    void loadHeroStats();
    void loadProfiles();
  }, [loadActivities, loadHeroStats, loadProfiles]);

  const refreshProfileScopedData = async () => {
    await loadSettings();
    await recalculateDailySummaries();
    await recalculateUserProgress();
    await loadProfiles();
    await loadActivities();
    await loadHeroStats();
  };

  const activeDays = new Set(heroStats.summaries.map((summary) => summary.localDate)).size;
  const allActivityStreak = calculateStreaks(
    heroStats.workouts.map((workout) => workout.localDate)
  );
  const exportJson = async () => {
    const json = await stringifyExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fit-quest-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t("settings.exportReady"));
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    const payload = parseImportJson(text);
    if (!payload) {
      setStatus(`Import failed: JSON did not match the ${APP_NAME} schema.`);
      return;
    }
    if (!window.confirm(`Import will replace existing ${APP_NAME} data on this device.`)) {
      return;
    }
    await replaceAllData(payload);
    await loadProfiles();
    await loadActivities();
    await loadHeroStats();
    await loadSettings();
    setStatus(t("settings.importComplete"));
  };

  const addCustomActivity = async () => {
    if (!newName.trim()) {
      return;
    }

    await createCustomActivity({ name: newName, unit: newUnit });
    setNewName("");
    setNewUnit("reps");
    await loadActivities();
    setStatus(t("settings.customActivityAdded"));
  };

  const resetData = async () => {
    if (!window.confirm(`Reset all ${APP_NAME} data on this device?`)) {
      return;
    }
    await resetAllData();
    await loadProfiles();
    await loadActivities();
    await loadHeroStats();
    await loadSettings();
    setStatus(t("settings.allDataReset"));
  };

  return (
    <section className="space-y-4 lg:space-y-6">
      <ProfileHeroSection context="progress" variant="compact" />
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="app-card rounded-[1.75rem] p-5">
            <h2 className="text-app text-lg font-black">{t("profile.profileHero")}</h2>
            <label className="mt-4 block">
              <span className="text-app-soft mb-2 block text-sm font-bold">
                {t("profile.displayName")}
              </span>
              <input
                className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                onChange={(event) => void updateSettings({ displayName: event.target.value })}
                value={settings?.displayName ?? t("common.player")}
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ProfileNumberField
                label={t("profile.weightKg")}
                onChange={(value) =>
                  void updateSettings(value === undefined ? {} : { weightKg: value })
                }
                value={settings?.weightKg}
              />
              <ProfileNumberField
                label={t("profile.heightCm")}
                onChange={(value) =>
                  void updateSettings(value === undefined ? {} : { heightCm: value })
                }
                value={settings?.heightCm}
              />
              <ProfileNumberField
                label={t("profile.goalWeightKg")}
                onChange={(value) =>
                  void updateSettings(value === undefined ? {} : { goalWeightKg: value })
                }
                value={settings?.goalWeightKg}
              />
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-inset)] p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-app text-sm font-black">{t("settings.localProfiles")}</h3>
                <button
                  className="focus-ring rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-black text-[var(--accent-contrast)]"
                  onClick={async () => {
                    const profile = await createProfile({ name: t("common.player") });
                    await switchActiveProfile(profile.id);
                    await refreshProfileScopedData();
                  }}
                  type="button"
                >
                  {t("settings.addProfile")}
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {profiles.map((profile) => {
                  const active = profile.id === settings?.profileId || profile.active;
                  return (
                    <div
                      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm font-bold transition ${
                        active ? "accent-selected text-app" : "app-inset text-app-soft"
                      }`}
                      key={profile.id}
                    >
                      <button
                        aria-pressed={active}
                        className="focus-ring min-h-10 flex-1 rounded-lg text-left"
                        onClick={async () => {
                          await switchActiveProfile(profile.id);
                          await refreshProfileScopedData();
                        }}
                        type="button"
                      >
                        <span>{profile.name}</span>
                        <span className="ml-2 text-xs font-black uppercase tracking-[0.12em]">
                          {active ? t("common.active") : t("settings.switchProfile")}
                        </span>
                      </button>
                      <button
                        className="focus-ring min-h-9 rounded-lg px-2 text-xs font-black text-[var(--danger)] disabled:opacity-40"
                        disabled={profiles.length <= 1}
                        onClick={async () => {
                          try {
                            await deleteProfile(profile.id);
                            await refreshProfileScopedData();
                            setStatus(t("settings.profileDeleted"));
                          } catch (error) {
                            setStatus(error instanceof Error ? error.message : t("errors.generic"));
                          }
                        }}
                        type="button"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <fieldset className="mt-4">
              <legend className="text-app-soft mb-2 text-sm font-bold">
                {t("profile.avatar")}
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_OPTIONS.map((avatar) => {
                  const Icon = avatar.icon;
                  const selected = (settings?.avatarId ?? "default") === avatar.id;
                  return (
                    <button
                      aria-label={`Use ${avatar.label} avatar`}
                      aria-pressed={selected}
                      className={`focus-ring flex aspect-square items-center justify-center rounded-2xl transition ${
                        selected ? "accent-selected" : "app-inset"
                      }`}
                      key={avatar.id}
                      onClick={() => void updateSettings({ avatarId: avatar.id })}
                      style={{ background: selected ? avatar.gradient : undefined }}
                      type="button"
                    >
                      <Icon
                        aria-hidden="true"
                        className={
                          selected ? "text-[var(--accent-contrast)]" : "text-[var(--accent)]"
                        }
                        size={22}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <HeroMetric label={t("profile.activeDays")} value={String(activeDays)} />
              <HeroMetric label={t("profile.bestStreak")} value={`${allActivityStreak.best}d`} />
            </div>
          </section>
          <section className="app-card rounded-[1.75rem] p-5">
            <h2 className="text-app text-lg font-black">{t("settings.feedback")}</h2>
            <div className="mt-2 space-y-1">
              <ToggleSwitch
                checked={Boolean(settings?.soundEnabled)}
                description={t("settings.soundDescription")}
                label={t("settings.sound")}
                onChange={(checked) => void updateSettings({ soundEnabled: checked })}
              />
              <ToggleSwitch
                checked={Boolean(settings?.hapticsEnabled)}
                description={t("settings.hapticsDescription")}
                label={t("settings.haptics")}
                onChange={(checked) => void updateSettings({ hapticsEnabled: checked })}
              />
              <ToggleSwitch
                checked={Boolean(settings?.countdownEnabled)}
                description={t("settings.countdownDescription")}
                label={t("settings.countdownTimer")}
                onChange={(checked) => void updateSettings({ countdownEnabled: checked })}
              />
            </div>
          </section>
        </aside>
        <div className="space-y-4">
          <section className="app-card rounded-[1.75rem] p-5">
            <h2 className="text-app text-xl font-black">{t("settings.theme")}</h2>
            <div className="mt-5">
              <ThemeSelector
                colorMode={settings?.colorMode ?? "dark"}
                onChange={(choice) =>
                  void updateSettings({ uiStyle: choice.uiStyle, colorMode: choice.colorMode })
                }
                uiStyle={settings?.uiStyle ?? "neomorphism"}
              />
            </div>
            <div className="mt-5 grid gap-3 xl:grid-cols-3">
              <SegmentedSetting
                label={t("theme.mode")}
                onChange={(value) => void updateSettings({ colorMode: value as "light" | "dark" })}
                options={[
                  { label: t("theme.light"), value: "light" },
                  { label: t("theme.dark"), value: "dark" }
                ]}
                value={settings?.colorMode ?? "dark"}
              />
              <SegmentedSetting
                label={t("settings.viewMode")}
                onChange={(value) =>
                  void updateSettings({ viewMode: value as "basic" | "advanced" })
                }
                options={[
                  { label: t("common.basic"), value: "basic" },
                  { label: t("common.advanced"), value: "advanced" }
                ]}
                value={settings?.viewMode ?? "basic"}
              />
              <SegmentedSetting
                label={t("settings.uiDensity")}
                onChange={(value) =>
                  void updateSettings({ uiDensity: value as "cozy" | "compact" })
                }
                options={[
                  { label: t("settings.cozy"), value: "cozy" },
                  { label: t("settings.compact"), value: "compact" }
                ]}
                value={settings?.uiDensity ?? "cozy"}
              />
            </div>
            <div className="mt-6 border-t border-[var(--border-soft)] pt-5">
              <AccentColorControl
                hueLabel={t("settings.hueSlider")}
                onChange={(accentColor) => void updateSettings({ accentColor })}
                resetLabel={t("settings.resetDefault")}
                title={t("settings.themeAccent")}
                value={settings?.accentColor ?? DEFAULT_ACCENT}
              />
            </div>
          </section>
          <section className="app-card rounded-[1.75rem] p-5">
            <h2 className="text-app text-lg font-black">{t("settings.language")}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SegmentedSetting
                label={t("settings.appLanguage")}
                onChange={(value) => void updateSettings({ appLanguage: value as "en" | "el" })}
                options={[
                  { label: t("settings.english"), value: "en" },
                  { label: t("settings.greek"), value: "el" }
                ]}
                value={settings?.appLanguage ?? "en"}
              />
              <SegmentedSetting
                label={t("settings.adventureLanguage")}
                onChange={(value) =>
                  void updateSettings({ adventureLanguage: value as "same" | "en" | "el" })
                }
                options={[
                  { label: t("settings.sameAsApp"), value: "same" },
                  { label: t("settings.english"), value: "en" },
                  { label: t("settings.greek"), value: "el" }
                ]}
                value={settings?.adventureLanguage ?? "same"}
              />
            </div>
          </section>
          <section className="app-card rounded-[1.75rem] p-5">
            <h2 className="text-app text-lg font-black">{t("settings.addCustomActivity")}</h2>
            <label className="mt-4 block">
              <span className="text-app-soft mb-2 block text-sm font-bold">
                {t("settings.name")}
              </span>
              <input
                className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                onChange={(event) => setNewName(event.target.value)}
                value={newName}
              />
            </label>
            <fieldset className="mt-3">
              <legend className="text-app-soft mb-2 block text-sm font-bold">
                {t("settings.unit")}
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(["reps", "seconds", "distance", "weight"] as const).map((unit) => (
                  <button
                    aria-pressed={newUnit === unit}
                    className={`focus-ring min-h-12 rounded-2xl px-4 font-bold transition ${
                      newUnit === unit ? "accent-selected text-app" : "app-inset text-app"
                    }`}
                    key={unit}
                    onClick={() => setNewUnit(unit)}
                    type="button"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </fieldset>
            <NeomorphicButton className="mt-4 w-full" onClick={addCustomActivity} variant="primary">
              {t("common.addActivity")}
            </NeomorphicButton>
          </section>
          <section className="space-y-3">
            <h2 className="text-app px-1 text-lg font-black">{t("settings.activityManagement")}</h2>
            <div className="grid gap-3 xl:grid-cols-2">
              {activities.map((activity) => (
                <ActivitySettingsCard
                  activity={activity}
                  key={activity.id}
                  onArchive={async () => {
                    if (window.confirm(`Archive ${activity.name}?`)) {
                      await archiveCustomActivity(activity.id);
                      await loadActivities();
                    }
                  }}
                  onChange={async (updates) => {
                    await updateActivity(activity.id, updates);
                    await loadActivities();
                  }}
                  t={t}
                />
              ))}
            </div>
          </section>
          <section className="app-card rounded-[1.75rem] p-5">
            <h2 className="text-app text-lg font-black">{t("settings.data")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <NeomorphicButton
                className="flex items-center justify-center gap-2"
                onClick={exportJson}
                variant="secondary"
              >
                <Download aria-hidden="true" size={17} />
                {t("settings.exportJson")}
              </NeomorphicButton>
              <NeomorphicButton
                className="flex items-center justify-center gap-2"
                onClick={() => importInputRef.current?.click()}
                variant="secondary"
              >
                <Upload aria-hidden="true" size={17} />
                {t("settings.importJson")}
              </NeomorphicButton>
            </div>
            <input
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importJson(file);
                }
                event.target.value = "";
              }}
              ref={importInputRef}
              type="file"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NeomorphicButton onClick={resetData} variant="danger">
                {t("settings.resetAllData")}
              </NeomorphicButton>
              <NeomorphicButton
                onClick={() => void updateSettings({ onboardingCompleted: false })}
                variant="secondary"
              >
                {t("settings.rerunOnboarding")}
              </NeomorphicButton>
            </div>
            {status ? <p className="mt-3 text-sm text-[#94A3B8]">{status}</p> : null}
          </section>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-inset rounded-2xl p-3 text-center">
      <p className="truncate text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[#F8FAFC]">{value}</p>
    </div>
  );
}

function ProfileNumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value?: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="text-app-soft mb-1 block text-xs font-bold">{label}</span>
      <input
        className="focus-ring app-inset min-h-11 w-full rounded-2xl px-3 text-app"
        min={0}
        onBlur={(event) => {
          const parsed = Number(event.target.value);
          onChange(event.target.value.trim() && Number.isFinite(parsed) ? parsed : undefined);
        }}
        step="0.1"
        type="number"
        defaultValue={value ?? ""}
      />
    </label>
  );
}

function SegmentedSetting({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-app-soft mb-2 text-sm font-bold">{label}</legend>
      <div
        className="app-inset grid gap-2 rounded-2xl p-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={`focus-ring min-h-11 rounded-xl px-3 text-sm font-black transition ${
              value === option.value
                ? "bg-[var(--accent)] text-white shadow-[var(--accent-glow)]"
                : "text-app-soft hover:bg-[var(--hover-soft)]"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ActivitySettingsCard({
  activity,
  onChange,
  onArchive,
  t
}: {
  activity: Activity;
  onChange: (updates: Partial<Activity>) => void;
  onArchive: () => void;
  t: (key: string) => string;
}) {
  const [name, setName] = useState(activity.name);

  useEffect(() => {
    setName(activity.name);
  }, [activity.name]);

  return (
    <article className="app-card rounded-[1.75rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-app font-black">{activity.name}</h3>
          <p className="text-app-muted text-sm">
            {activity.unit} ·{" "}
            {activity.isDefault
              ? t("settings.default")
              : activity.isArchived
                ? t("settings.archived")
                : t("settings.custom")}
          </p>
        </div>
        {!activity.isDefault && !activity.isArchived ? (
          <NeomorphicButton onClick={onArchive} variant="ghost">
            {t("settings.archive")}
          </NeomorphicButton>
        ) : null}
      </div>
      {!activity.isDefault ? (
        <label className="mt-3 block">
          <span className="text-app-muted mb-1 block text-xs font-bold">
            {t("settings.customActivityName")}
          </span>
          <input
            className="focus-ring app-inset min-h-11 w-full rounded-2xl px-3 text-[#F8FAFC]"
            onBlur={() => onChange({ name })}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField
          label={t("settings.restSeconds")}
          onChange={(value) => onChange({ defaultRestSeconds: value })}
          value={activity.defaultRestSeconds}
        />
        <div className="col-span-2">
          <ToggleSwitch
            checked={activity.autoRestEnabled}
            label={t("settings.autoRest")}
            onChange={(checked) => onChange({ autoRestEnabled: checked })}
          />
        </div>
        <NumberField
          label={t("settings.dailyGoal")}
          onChange={(value) =>
            onChange({ dailyGoal: activity.unit === "distance" ? Math.round(value * 1000) : value })
          }
          suffix={activity.unit === "distance" ? "km" : undefined}
          value={activity.unit === "distance" ? activity.dailyGoal / 1000 : activity.dailyGoal}
        />
        <NumberField
          label={t("settings.weeklyGoal")}
          onChange={(value) =>
            onChange({
              weeklyGoal: activity.unit === "distance" ? Math.round(value * 1000) : value
            })
          }
          suffix={activity.unit === "distance" ? "km" : undefined}
          value={activity.unit === "distance" ? activity.weeklyGoal / 1000 : activity.weeklyGoal}
        />
        <NumberField
          label={t("settings.monthlyGoal")}
          onChange={(value) =>
            onChange({
              monthlyGoal: activity.unit === "distance" ? Math.round(value * 1000) : value
            })
          }
          suffix={activity.unit === "distance" ? "km" : undefined}
          value={activity.unit === "distance" ? activity.monthlyGoal / 1000 : activity.monthlyGoal}
        />
        <NumberField
          label={t("settings.yearlyGoal")}
          onChange={(value) =>
            onChange({
              yearlyGoal: activity.unit === "distance" ? Math.round(value * 1000) : value
            })
          }
          suffix={activity.unit === "distance" ? "km" : undefined}
          value={activity.unit === "distance" ? activity.yearlyGoal / 1000 : activity.yearlyGoal}
        />
      </div>
    </article>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-[#94A3B8]">
        {label}
        {suffix ? ` (${suffix})` : ""}
      </span>
      <input
        className="focus-ring app-inset min-h-11 w-full rounded-2xl px-3 text-app"
        min={0}
        onBlur={(event) => onChange(Number(event.target.value))}
        onChange={(event) => onChange(Number(event.target.value))}
        step={suffix === "km" ? "0.1" : "1"}
        type="number"
        value={value}
      />
    </label>
  );
}
