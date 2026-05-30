import { useEffect, useMemo, useState } from "react";
import { ProfileHeroSection } from "../../components/profile/ProfileHeroSection";
import { AchievementCard } from "../../components/records/AchievementCard";
import { RecordCard } from "../../components/records/RecordCard";
import { listAchievements } from "../../db/repositories/achievementsRepo";
import { listActivities } from "../../db/repositories/activitiesRepo";
import { listSummaries } from "../../db/repositories/summariesRepo";
import { listWorkouts } from "../../db/repositories/workoutsRepo";
import type { Achievement, Activity, DailyActivitySummary, Workout } from "../../db/schema";
import { useSettingsStore } from "../../stores/settingsStore";
import { formatDisplayDate } from "../../utils/dates";
import { translate } from "../../utils/i18n";
import { getWeekKey } from "../../utils/stats";
import { calculateStreaks } from "../../utils/streaks";
import { getSummaryValueForActivity } from "../../utils/workoutMetrics";

interface ActivityRecord {
  activity: Activity;
  bestSet: number;
  bestDistanceMeters: number;
  bestDay: { localDate: string; value: number };
  bestWeek: number;
  bestMonth: number;
  longestStreak: number;
  totalValue: number;
}

const bestGroupedValue = (
  summaries: DailyActivitySummary[],
  getKey: (summary: DailyActivitySummary) => string
) => {
  const grouped = new Map<string, number>();
  for (const summary of summaries) {
    const key = getKey(summary);
    grouped.set(key, (grouped.get(key) ?? 0) + getSummaryValueForActivity(summary));
  }

  return Math.max(0, ...Array.from(grouped.values()));
};

export function RecordsScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [summaries, setSummaries] = useState<DailyActivitySummary[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const t = (key: string) => translate(appLanguage, key);

  useEffect(() => {
    const load = async () => {
      const [nextActivities, nextWorkouts, nextSummaries, nextAchievements] = await Promise.all([
        listActivities({ includeArchived: true }),
        listWorkouts(),
        listSummaries(),
        listAchievements()
      ]);
      setActivities(nextActivities);
      setWorkouts(nextWorkouts);
      setSummaries(nextSummaries);
      setAchievements(nextAchievements);
    };

    void load();
  }, []);

  const records = useMemo<ActivityRecord[]>(
    () =>
      activities.map((activity) => {
        const activityWorkouts = workouts.filter((workout) => workout.activityId === activity.id);
        const activitySummaries = summaries.filter((summary) => summary.activityId === activity.id);
        const bestDay = activitySummaries.reduce(
          (best, summary) =>
            getSummaryValueForActivity(summary, activity) > best.value
              ? {
                  localDate: summary.localDate,
                  value: getSummaryValueForActivity(summary, activity)
                }
              : best,
          { localDate: "", value: 0 }
        );

        return {
          activity,
          bestSet: activitySummaries.reduce(
            (best, summary) => Math.max(best, summary.bestSet ?? 0),
            0
          ),
          bestDistanceMeters: activitySummaries.reduce(
            (best, summary) => Math.max(best, summary.bestDistanceMeters ?? 0),
            0
          ),
          bestDay,
          bestWeek: bestGroupedValue(activitySummaries, (summary) => getWeekKey(summary.localDate)),
          bestMonth: bestGroupedValue(activitySummaries, (summary) =>
            summary.localDate.slice(0, 7)
          ),
          longestStreak: calculateStreaks(activityWorkouts.map((workout) => workout.localDate))
            .best,
          totalValue: activitySummaries.reduce(
            (total, summary) => total + getSummaryValueForActivity(summary, activity),
            0
          )
        };
      }),
    [activities, workouts, summaries]
  );

  return (
    <section className="space-y-4 lg:space-y-6">
      <ProfileHeroSection context="progress" variant="full" />
      <section className="space-y-3">
        <h2 className="text-app px-1 text-lg font-black">{t("common.records")}</h2>
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {records.map((record) => (
            <RecordPanel appLanguage={appLanguage} key={record.activity.id} record={record} />
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-app px-1 text-lg font-black">{t("common.achievements")}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementCard achievement={achievement} key={achievement.id} />
          ))}
        </div>
      </section>
    </section>
  );
}

function RecordPanel({
  appLanguage,
  record
}: {
  appLanguage: "en" | "el";
  record: ActivityRecord;
}) {
  const t = (key: string) => translate(appLanguage, key);
  const formatRecordValue = (value: number) => {
    if (record.activity.activityType === "cardio") {
      return `${(value / 1000).toFixed(2)} km`;
    }
    if (record.activity.activityType === "timed") {
      return `${Math.floor(value / 60)}m ${value % 60}s`;
    }
    return String(value);
  };

  return (
    <div className="app-card rounded-[1.75rem] p-4">
      <h3 className="text-app font-black">{record.activity.name}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {record.activity.activityType === "cardio" ? (
          <RecordCard
            label={t("records.bestDistance")}
            value={formatRecordValue(record.bestDistanceMeters)}
          />
        ) : (
          <RecordCard label={t("records.bestSet")} value={formatRecordValue(record.bestSet)} />
        )}
        <RecordCard
          detail={
            record.bestDay.localDate
              ? formatDisplayDate(record.bestDay.localDate)
              : t("common.none")
          }
          label={t("records.bestDay")}
          value={formatRecordValue(record.bestDay.value)}
        />
        <RecordCard label={t("records.bestWeek")} value={formatRecordValue(record.bestWeek)} />
        <RecordCard label={t("records.bestMonth")} value={formatRecordValue(record.bestMonth)} />
        <RecordCard label={t("records.longestStreak")} value={`${record.longestStreak}d`} />
        <RecordCard
          label={t("records.allTimeTotal")}
          value={formatRecordValue(record.totalValue)}
        />
      </div>
    </div>
  );
}
