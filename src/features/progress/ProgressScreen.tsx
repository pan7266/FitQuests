import { useEffect, useState } from "react";
import { ProfileHeroSection } from "../../components/profile/ProfileHeroSection";
import { AchievementCard } from "../../components/records/AchievementCard";
import { listAchievements } from "../../db/repositories/achievementsRepo";
import { listActivities } from "../../db/repositories/activitiesRepo";
import { listAdventureState } from "../../db/repositories/adventureRepo";
import { listSummaries } from "../../db/repositories/summariesRepo";
import { listTrainLogs } from "../../db/repositories/trainLogsRepo";
import { listWorkouts } from "../../db/repositories/workoutsRepo";
import type {
  Achievement,
  Activity,
  AdventureEvent,
  DailyActivitySummary,
  TrainLog,
  Workout
} from "../../db/schema";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../utils/classNames";
import {
  formatDisplayDateTime,
  formatDuration,
  getPeriodRange,
  isLocalDateInRange,
  toLocalDate
} from "../../utils/dates";
import { translate } from "../../utils/i18n";
import { getSummaryValueForActivity } from "../../utils/workoutMetrics";
import { CalendarScreen } from "../calendar/CalendarScreen";
import { StatsScreen } from "../stats/StatsScreen";

type ProgressView = "stats" | "calendar" | "records" | "achievements" | "workouts" | "adventure";

const views: Array<{ id: ProgressView; labelKey: string }> = [
  { id: "stats", labelKey: "common.stats" },
  { id: "calendar", labelKey: "common.calendar" },
  { id: "records", labelKey: "common.records" },
  { id: "achievements", labelKey: "common.achievements" },
  { id: "workouts", labelKey: "progress.workoutHistory" },
  { id: "adventure", labelKey: "progress.adventureHistory" }
];

export function ProgressScreen() {
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const t = (key: string) => translate(appLanguage, key);
  const [activeView, setActiveView] = useState<ProgressView>("stats");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [summaries, setSummaries] = useState<DailyActivitySummary[]>([]);
  const [trainLogs, setTrainLogs] = useState<TrainLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [events, setEvents] = useState<AdventureEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const [
        nextActivities,
        nextWorkouts,
        nextSummaries,
        nextTrainLogs,
        nextAchievements,
        adventure
      ] = await Promise.all([
        listActivities({ includeArchived: true }),
        listWorkouts(),
        listSummaries(),
        listTrainLogs(),
        listAchievements(),
        listAdventureState()
      ]);
      setActivities(nextActivities);
      setWorkouts(nextWorkouts);
      setSummaries(nextSummaries);
      setTrainLogs(nextTrainLogs);
      setAchievements(nextAchievements);
      setEvents(adventure.events);
    };

    void load();
  }, []);

  const renderView = () => {
    if (activeView === "stats") {
      return <StatsScreen />;
    }
    if (activeView === "calendar") {
      return <CalendarScreen />;
    }
    if (activeView === "achievements") {
      return <AchievementsView achievements={achievements} appLanguage={appLanguage} />;
    }
    if (activeView === "workouts") {
      return (
        <WorkoutHistory
          activities={activities}
          appLanguage={appLanguage}
          trainLogs={trainLogs}
          workouts={workouts}
        />
      );
    }
    if (activeView === "adventure") {
      return <AdventureHistory appLanguage={appLanguage} events={events} />;
    }

    return (
      <RecordsView
        activities={activities}
        appLanguage={appLanguage}
        summaries={summaries}
        workouts={workouts}
      />
    );
  };

  return (
    <section className="space-y-4 lg:space-y-6">
      <header>
        <h1 className="text-app text-3xl font-black">{t("common.progress")}</h1>
      </header>
      <ProfileHeroSection context="progress" variant="full" />
      <div
        aria-label={t("common.progress")}
        className="app-inset grid grid-cols-2 gap-2 rounded-[1.5rem] p-2 md:grid-cols-3 xl:grid-cols-6"
        role="tablist"
      >
        {views.map((view) => (
          <button
            aria-selected={activeView === view.id}
            className={cn(
              "focus-ring min-h-11 rounded-2xl px-3 text-sm font-black transition",
              activeView === view.id
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
                : "text-app-soft hover:bg-[var(--hover-soft)]"
            )}
            key={view.id}
            onClick={() => setActiveView(view.id)}
            role="tab"
            type="button"
          >
            {t(view.labelKey)}
          </button>
        ))}
      </div>
      {renderView()}
    </section>
  );
}

function RecordsView({
  activities,
  appLanguage,
  summaries,
  workouts
}: {
  activities: Activity[];
  appLanguage: "en" | "el";
  summaries: DailyActivitySummary[];
  workouts: Workout[];
}) {
  const t = (key: string) => translate(appLanguage, key);
  const today = toLocalDate();
  const weekRange = getPeriodRange("week");
  const monthRange = getPeriodRange("month");
  const yearRange = getPeriodRange("year");
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {activities.map((activity) => {
        const activitySummaries = summaries.filter((summary) => summary.activityId === activity.id);
        const todayValue = totalForRange(activitySummaries, activity, { start: today, end: today });
        const weekValue = totalForRange(activitySummaries, activity, weekRange);
        const monthValue = totalForRange(activitySummaries, activity, monthRange);
        const yearValue = totalForRange(activitySummaries, activity, yearRange);
        const xp = workouts
          .filter((workout) => workout.activityId === activity.id)
          .reduce((total, workout) => total + workout.xpAwarded, 0);
        return (
          <article className="app-card rounded-[1.75rem] p-4" key={activity.id}>
            <p className="text-app-muted text-xs font-black uppercase tracking-[0.16em]">
              {t("records.workout")}
            </p>
            <h2 className="text-app mt-1 text-xl font-black">
              {translateActivityName(appLanguage, activity)}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <RecordMetric
                label={t("records.qtyDay")}
                value={formatMetric(todayValue, activity)}
              />
              <RecordMetric
                label={t("records.qtyWeek")}
                value={formatMetric(weekValue, activity)}
              />
              <RecordMetric
                label={t("records.qtyMonth")}
                value={formatMetric(monthValue, activity)}
              />
              <RecordMetric
                label={t("records.qtyYear")}
                value={formatMetric(yearValue, activity)}
              />
              <RecordMetric
                label={t("records.goals")}
                value={
                  activity.dailyGoal > 0
                    ? `${formatMetric(todayValue, activity)} / ${formatMetric(
                        activity.dailyGoal,
                        activity
                      )}`
                    : t("train.noGoal")
                }
              />
              <RecordMetric label="XP" value={String(xp)} />
            </div>
          </article>
        );
      })}
    </section>
  );
}

function totalForRange(
  summaries: DailyActivitySummary[],
  activity: Activity,
  range: { start: string; end: string }
) {
  return summaries
    .filter((summary) => isLocalDateInRange(summary.localDate, range))
    .reduce((total, summary) => total + getSummaryValueForActivity(summary, activity), 0);
}

function formatMetric(value: number, activity: Activity) {
  if (activity.activityType === "cardio") {
    return `${(value / 1000).toFixed(1)} km`;
  }
  if (activity.activityType === "timed") {
    return formatDuration(value);
  }
  return `${Math.round(value).toLocaleString()} reps`;
}

function formatTrainLogValue(log: TrainLog) {
  if (log.distanceMeters !== undefined) {
    return `${(log.distanceMeters / 1000).toFixed(2)} km`;
  }
  if (log.durationSeconds !== undefined) {
    return formatDuration(log.durationSeconds);
  }
  if (log.weightKg !== undefined && log.reps !== undefined) {
    return `${log.reps} reps @ ${log.weightKg} kg`;
  }
  if (log.reps !== undefined) {
    return `${log.reps} reps`;
  }
  return "logged";
}

function RecordMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-inset)] p-3">
      <p className="text-app-muted text-[0.62rem] font-black uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="text-app mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function AchievementsView({
  achievements,
  appLanguage
}: {
  achievements: Achievement[];
  appLanguage: "en" | "el";
}) {
  const t = (key: string) => translate(appLanguage, key);
  const [filter, setFilter] = useState<"all" | "unlocked" | "close" | "locked">("all");
  const [category, setCategory] = useState<string>("all");
  const categories = Array.from(
    new Set(achievements.map((achievement) => achievement.category))
  ).sort();
  const filtered = achievements.filter((achievement) => {
    if (category !== "all" && achievement.category !== category) {
      return false;
    }
    if (filter === "unlocked") {
      return Boolean(achievement.unlockedAt);
    }
    if (filter === "locked") {
      return !achievement.unlockedAt;
    }
    if (filter === "close") {
      return (
        !achievement.unlockedAt &&
        achievement.progressTarget !== undefined &&
        achievement.progressCurrent !== undefined &&
        achievement.progressCurrent / achievement.progressTarget >= 0.6
      );
    }
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="app-inset flex flex-wrap gap-2 rounded-2xl p-2">
        {(["all", "unlocked", "close", "locked"] as const).map((item) => (
          <button
            className={cn(
              "focus-ring min-h-10 rounded-xl px-3 text-sm font-black capitalize",
              filter === item
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "text-app-soft hover:bg-[var(--hover-soft)]"
            )}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {t(`achievements.filter.${item}`)}
          </button>
        ))}
      </div>
      <div className="app-inset flex gap-2 overflow-x-auto rounded-2xl p-2">
        {["all", ...categories].map((item) => (
          <button
            className={cn(
              "focus-ring min-h-10 shrink-0 rounded-xl px-3 text-sm font-black",
              category === item
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "text-app-soft hover:bg-[var(--hover-soft)]"
            )}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >
            {item === "all" ? t("achievements.categoryAll") : item}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((achievement) => (
          <AchievementCard achievement={achievement} key={achievement.id} />
        ))}
      </div>
    </section>
  );
}

function WorkoutHistory({
  activities,
  appLanguage,
  trainLogs,
  workouts
}: {
  activities: Activity[];
  appLanguage: "en" | "el";
  trainLogs: TrainLog[];
  workouts: Workout[];
}) {
  const t = (key: string) => translate(appLanguage, key);
  const trainLogsByWorkout = new Map(trainLogs.map((log) => [log.workoutId, log]));
  return (
    <section className="app-card rounded-[1.75rem] p-5">
      <h2 className="text-app text-xl font-black">{t("progress.workoutHistory")}</h2>
      <p className="text-app-soft mt-1 text-sm">
        {trainLogs.length} {t("progress.trainEntries")}
      </p>
      <div className="mt-4 space-y-2">
        {workouts.length === 0 ? (
          <p className="text-app-soft text-sm">{t("progress.noWorkoutsLogged")}</p>
        ) : (
          workouts.slice(0, 40).map((workout) => {
            const activity = activities.find((item) => item.id === workout.activityId);
            const trainLog = trainLogsByWorkout.get(workout.id);
            return (
              <div className="rounded-2xl bg-[var(--surface-inset)] px-4 py-3" key={workout.id}>
                <p className="text-app font-bold">
                  {activity ? translateActivityName(appLanguage, activity) : t("common.workout")}
                </p>
                <p className="text-app-muted mt-1 text-sm">
                  {formatDisplayDateTime(workout.startedAt)} ·{" "}
                  {trainLog ? formatTrainLogValue(trainLog) : `${workout.xpAwarded} XP`} ·{" "}
                  {workout.xpAwarded} XP
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AdventureHistory({
  appLanguage,
  events
}: {
  appLanguage: "en" | "el";
  events: AdventureEvent[];
}) {
  const t = (key: string) => translate(appLanguage, key);
  return (
    <section className="app-card rounded-[1.75rem] p-5">
      <h2 className="text-app text-xl font-black">{t("progress.adventureHistory")}</h2>
      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <p className="text-app-soft text-sm">{t("progress.noAdventureEvents")}</p>
        ) : (
          events.map((event) => (
            <div className="border-l-2 border-[var(--accent)] py-1 pl-3" key={event.id}>
              <p className="text-app font-bold">{event.title}</p>
              <p className="text-app-muted mt-1 text-sm">{event.description}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function translateActivityName(language: "en" | "el", activity: Activity) {
  const keyBySlug: Record<string, string> = {
    pullups: "activities.pullups",
    pushups: "activities.pushups",
    situps: "activities.situps",
    squats: "activities.squats",
    treadmill: "activities.treadmill"
  };
  const key = keyBySlug[activity.slug];
  return key ? translate(language, key) : activity.name;
}
