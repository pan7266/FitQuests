import { Map as MapIcon, Swords } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileHeroSection } from "../../components/profile/ProfileHeroSection";
import { listActivities } from "../../db/repositories/activitiesRepo";
import { listAdventureState } from "../../db/repositories/adventureRepo";
import {
  addHealthLog,
  listHealthLogsForDate,
  listHealthTasks
} from "../../db/repositories/healthRepo";
import { listSummaries } from "../../db/repositories/summariesRepo";
import type {
  Activity,
  AdventureMob,
  AdventureMobRequirement,
  DailyActivitySummary,
  HealthLog,
  HealthTask,
  HeroProgress
} from "../../db/schema";
import { useAppStore } from "../../stores/appStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { formatDuration, toLocalDate } from "../../utils/dates";
import { translate } from "../../utils/i18n";
import { getDailyGoalMultiplierLabel } from "../../utils/stats";

interface HomeState {
  activities: Activity[];
  summaries: DailyActivitySummary[];
  healthTasks: HealthTask[];
  healthLogs: HealthLog[];
  hero?: HeroProgress | undefined;
  activeMob?: AdventureMob | undefined;
  activeRequirement?: AdventureMobRequirement | undefined;
}

export function HomeScreen() {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setActiveBattle = useAppStore((state) => state.setActiveBattle);
  const setSelectedActivityId = useAppStore((state) => state.setSelectedActivityId);
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const t = (key: string) => translate(appLanguage, key);
  const [state, setState] = useState<HomeState>({
    activities: [],
    summaries: [],
    healthTasks: [],
    healthLogs: []
  });

  const load = useCallback(async () => {
    const today = toLocalDate();
    const [activities, summaries, healthTasks, healthLogs, adventure] = await Promise.all([
      listActivities(),
      listSummaries(),
      listHealthTasks(),
      listHealthLogsForDate(today),
      listAdventureState()
    ]);
    const activeMob = adventure.mobs.find((mob) => mob.id === adventure.activeTarget?.mobId);
    const activeRequirement = activeMob
      ? adventure.mobRequirements.find((requirement) => requirement.mobId === activeMob.id)
      : undefined;
    setState({
      activities,
      summaries,
      healthTasks,
      healthLogs,
      hero: adventure.hero,
      activeMob,
      activeRequirement
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = toLocalDate();
  const activeFightActivity = useMemo(
    () => getActivityForRequirement(state.activeRequirement, state.activities),
    [state.activeRequirement, state.activities]
  );

  const continueFight = async () => {
    if (!state.activeMob) {
      setActiveTab("adventure");
      return;
    }
    void activeFightActivity;
    setActiveBattle({ enemyId: state.activeMob.id });
    setActiveTab("adventure");
  };

  const startExercise = (activityId: string) => {
    setSelectedActivityId(activityId);
    setActiveTab("train");
  };

  return (
    <section className="space-y-4 lg:space-y-6">
      <ProfileHeroSection context="home" variant="compact" />

      <NextActionCard
        activity={activeFightActivity}
        hero={state.hero}
        mob={state.activeMob}
        appLanguage={appLanguage}
        onChooseEnemy={() => setActiveTab("adventure")}
        onContinueFight={continueFight}
        requirement={state.activeRequirement}
        t={t}
      />

      <section className="app-card rounded-[1.75rem] p-5">
        <h2 className="text-app text-xl font-black">{t("home.todaysGoals")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.activities.slice(0, 6).map((activity) => (
            <GoalCard
              activity={activity}
              key={activity.id}
              summary={state.summaries.find(
                (summary) => summary.activityId === activity.id && summary.localDate === today
              )}
              onStartExercise={() => startExercise(activity.id)}
              onSetGoal={() => setActiveTab("settings")}
              t={t}
            />
          ))}
          {state.healthTasks.map((task) => (
            <HealthGoalCard
              key={task.id}
              logs={state.healthLogs.filter((log) => log.taskId === task.id)}
              onQuickAdd={async () => {
                await addHealthLog({ taskId: task.id, value: 250 });
                await load();
              }}
              task={task}
              t={t}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function HealthGoalCard({
  task,
  logs,
  onQuickAdd,
  t
}: {
  task: HealthTask;
  logs: HealthLog[];
  onQuickAdd: () => void;
  t: (key: string) => string;
}) {
  const current = logs.reduce((total, log) => total + log.value, 0);
  const complete = current >= task.dailyGoal;
  return (
    <article className="rounded-2xl bg-[var(--surface-inset)] p-4">
      <div className="flex justify-between gap-3">
        <p className="text-app font-black">{t("health.dailyWater")}</p>
        <span className="app-pill">{complete ? t("common.completed") : t("common.open")}</span>
      </div>
      <p className="text-app mt-2 text-xl font-black">
        {(current / 1000).toFixed(2)} / {(task.dailyGoal / 1000).toFixed(1)} L
      </p>
      <p className="text-app-soft mt-1 text-sm">{t("health.quickAddWater")}: 250 ml</p>
      <button
        className="focus-ring mt-3 min-h-10 w-full rounded-xl bg-[var(--accent)] px-3 text-sm font-black text-[var(--accent-contrast)]"
        onClick={onQuickAdd}
        type="button"
      >
        {t("health.addWater")}
      </button>
    </article>
  );
}

function NextActionCard({
  mob,
  requirement,
  activity,
  hero,
  appLanguage,
  onContinueFight,
  onChooseEnemy,
  t
}: {
  mob?: AdventureMob | undefined;
  requirement?: AdventureMobRequirement | undefined;
  activity?: Activity | undefined;
  hero?: HeroProgress | undefined;
  appLanguage: "en" | "el";
  onContinueFight: () => void;
  onChooseEnemy: () => void;
  t: (key: string) => string;
}) {
  if (!mob || !requirement) {
    return (
      <section className="app-card rounded-[2rem] p-5">
        <MapIcon aria-hidden="true" className="text-[var(--accent)]" size={26} />
        <p className="text-app-muted mt-4 text-xs font-black uppercase tracking-[0.16em]">
          {t("home.nextAction")}
        </p>
        <h2 className="text-app mt-1 text-2xl font-black">{t("home.chooseNextEnemy")}</h2>
        <p className="text-app-soft mt-2 text-sm leading-6">
          {t("home.chooseNextEnemyDescription")}
        </p>
        <button
          className="focus-ring mt-5 min-h-11 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
          onClick={onChooseEnemy}
          type="button"
        >
          {t("home.chooseEnemy")}
        </button>
      </section>
    );
  }

  const enemyHp = Math.max(0, requirement.requiredValue - requirement.currentValue);
  return (
    <section className="app-card rounded-[2rem] p-5">
      <Swords aria-hidden="true" className="text-[var(--accent)]" size={28} />
      <p className="text-app-muted mt-4 text-xs font-black uppercase tracking-[0.16em]">
        {t("home.nextBattle")}
      </p>
      <h2 className="text-app mt-1 text-2xl font-black">
        {appLanguage === "el" ? mob.titleEl : mob.title}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <InfoMetric
          label={t("battle.enemyHp")}
          value={`${enemyHp} / ${requirement.requiredValue}`}
        />
        <InfoMetric
          label={t("battle.heroHp")}
          value={`${hero?.currentHP ?? 100} / ${hero?.maxHP ?? 100}`}
        />
        <InfoMetric
          label={t("battle.requiredHit")}
          value={formatRequirement(requirement, activity)}
        />
        <InfoMetric label={t("battle.enemyAttack")} value="-5 HP" />
      </div>
      <p className="text-app-soft mt-3 text-sm">
        {t("adventure.reward")}: +{mob.rewardXP} XP
      </p>
      <button
        className="focus-ring mt-5 min-h-11 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
        onClick={onContinueFight}
        type="button"
      >
        {t("adventure.continueFight")}
      </button>
    </section>
  );
}

function GoalCard({
  activity,
  summary,
  onStartExercise,
  onSetGoal,
  t
}: {
  activity: Activity;
  summary?: DailyActivitySummary | undefined;
  onStartExercise: () => void;
  onSetGoal: () => void;
  t: (key: string) => string;
}) {
  const current =
    activity.activityType === "cardio"
      ? (summary?.totalDistanceMeters ?? 0)
      : activity.activityType === "timed"
        ? (summary?.totalSeconds ?? 0)
        : (summary?.totalReps ?? 0);
  if (activity.dailyGoal <= 0) {
    return (
      <article className="rounded-2xl bg-[var(--surface-inset)] p-2">
        <button
          className="focus-ring block w-full rounded-xl p-2 text-left"
          onClick={onStartExercise}
          type="button"
        >
          <p className="text-app font-black">{activity.name}</p>
          <p className="text-app-soft mt-1 text-sm">{t("home.noDailyGoal")}</p>
        </button>
        <button
          className="focus-ring mt-3 min-h-10 rounded-xl bg-[var(--accent)] px-3 text-sm font-black text-[var(--accent-contrast)]"
          onClick={onSetGoal}
          type="button"
        >
          {t("home.setGoal")}
        </button>
      </article>
    );
  }

  const percent = Math.min(999, (current / activity.dailyGoal) * 100);
  const remaining = Math.max(0, activity.dailyGoal - current);
  return (
    <button
      className="focus-ring rounded-2xl bg-[var(--surface-inset)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--hover-soft)]"
      onClick={onStartExercise}
      type="button"
    >
      <div className="flex justify-between gap-3">
        <p className="text-app font-black">{activity.name}</p>
        <span className="app-pill">
          {current >= activity.dailyGoal ? t("common.completed") : t("common.open")}
        </span>
      </div>
      <p className="text-app mt-2 text-xl font-black">
        {formatActivityValue(current, activity)} /{" "}
        {formatActivityValue(activity.dailyGoal, activity)}
      </p>
      <p className="text-app-soft mt-1 text-sm">
        {current >= activity.dailyGoal
          ? `${t("home.xpMultiplier")}: ${getDailyGoalMultiplierLabel(percent)}`
          : `${formatActivityValue(remaining, activity)} ${t("home.remaining")}`}
      </p>
    </button>
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-inset)] p-3">
      <p className="text-app-muted text-[0.65rem] font-black uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="text-app mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function getActivityForRequirement(
  requirement: AdventureMobRequirement | undefined,
  activities: Activity[]
) {
  if (!requirement) {
    return undefined;
  }
  if (requirement.activityId) {
    return activities.find((activity) => activity.id === requirement.activityId);
  }
  if (requirement.activitySlug) {
    return activities.find((activity) => activity.slug === requirement.activitySlug);
  }
  if (requirement.activityType) {
    return activities.find((activity) => activity.activityType === requirement.activityType);
  }
  return activities[0];
}

function formatRequirement(requirement: AdventureMobRequirement, activity: Activity | undefined) {
  const value = requirement.requiredValue;
  if (requirement.metric === "distanceMeters") {
    return `${(value / 1000).toFixed(2)} km ${activity?.name ?? ""}`.trim();
  }
  if (requirement.metric === "seconds") {
    return `${formatDuration(value)} ${activity?.name ?? ""}`.trim();
  }
  if (requirement.metric === "workouts") {
    return `${value} workouts`;
  }
  return `${value} ${activity?.name ?? "reps"}`;
}

function formatActivityValue(value: number, activity: Activity) {
  if (activity.activityType === "cardio") {
    return `${(value / 1000).toFixed(1)} km`;
  }
  if (activity.activityType === "timed") {
    return formatDuration(value);
  }
  return `${Math.round(value)} reps`;
}
