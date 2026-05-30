import type {
  Achievement,
  Activity,
  AdventureBoss,
  AdventureChest,
  AdventureEvent,
  DailyActivitySummary,
  HeroProgress,
  HeroSkill,
  UserProgress,
  Workout
} from "../db/schema";
import { getWeekKey } from "./stats";
import { calculateStreaks } from "./streaks";
import { getSummaryValueForActivity } from "./workoutMetrics";

type AchievementCategory =
  | "First steps"
  | "Strength"
  | "Pull-ups"
  | "Push-ups"
  | "Sit-ups"
  | "Squats"
  | "Treadmill"
  | "Timed activities"
  | "Streaks"
  | "Goals"
  | "Adventure"
  | "Bosses"
  | "Chests"
  | "Skills"
  | "XP / Levels"
  | "Consistency"
  | "Personal records";

interface AchievementDefinition {
  slug: string;
  title: string;
  description: string;
  category: AchievementCategory;
  target?: number;
  rewardXP?: number;
  rewardSkillPoints?: number;
  getProgress: (data: AchievementEvaluationData) => number;
}

export interface AchievementEvaluationData {
  activities: Activity[];
  workouts: Workout[];
  summaries: DailyActivitySummary[];
  hero?: HeroProgress | undefined;
  userProgress?: UserProgress | undefined;
  skills?: HeroSkill[];
  bosses?: AdventureBoss[];
  chests?: AdventureChest[];
  events?: AdventureEvent[];
}

const sumByPredicate = (
  data: AchievementEvaluationData,
  predicate: (activity: Activity) => boolean
) => {
  const activityIds = new Set(data.activities.filter(predicate).map((activity) => activity.id));

  return data.summaries
    .filter((summary) => activityIds.has(summary.activityId))
    .reduce((total, summary) => {
      const activity = data.activities.find((item) => item.id === summary.activityId);
      return total + getSummaryValueForActivity(summary, activity);
    }, 0);
};

const sumBySlug = (data: AchievementEvaluationData, slug: string) =>
  sumByPredicate(data, (activity) => activity.slug === slug);

const sumReps = (data: AchievementEvaluationData) =>
  sumByPredicate(data, (activity) => activity.activityType === "strength");

const sumTimedSeconds = (data: AchievementEvaluationData) =>
  sumByPredicate(data, (activity) => activity.activityType === "timed");

const sumTreadmillMeters = (data: AchievementEvaluationData) =>
  sumByPredicate(data, (activity) => activity.slug === "treadmill");

const completedDailyGoals = (data: AchievementEvaluationData) =>
  data.summaries.filter((summary) => {
    const activity = data.activities.find((item) => item.id === summary.activityId);
    return Boolean(
      activity &&
        activity.dailyGoal > 0 &&
        getSummaryValueForActivity(summary, activity) >= activity.dailyGoal
    );
  }).length;

const completedWeeklyGoals = (data: AchievementEvaluationData) => {
  let completed = 0;
  for (const activity of data.activities) {
    if (activity.weeklyGoal <= 0) {
      continue;
    }

    const weeklyTotals = new Map<string, number>();
    for (const summary of data.summaries.filter((item) => item.activityId === activity.id)) {
      const weekKey = getWeekKey(summary.localDate);
      weeklyTotals.set(
        weekKey,
        (weeklyTotals.get(weekKey) ?? 0) + getSummaryValueForActivity(summary, activity)
      );
    }
    completed += Array.from(weeklyTotals.values()).filter(
      (value) => value >= activity.weeklyGoal
    ).length;
  }

  return completed;
};

const completedMonthlyGoals = (data: AchievementEvaluationData) => {
  let completed = 0;
  for (const activity of data.activities) {
    if (activity.monthlyGoal <= 0) {
      continue;
    }

    const monthlyTotals = new Map<string, number>();
    for (const summary of data.summaries.filter((item) => item.activityId === activity.id)) {
      const monthKey = summary.localDate.slice(0, 7);
      monthlyTotals.set(
        monthKey,
        (monthlyTotals.get(monthKey) ?? 0) + getSummaryValueForActivity(summary, activity)
      );
    }
    completed += Array.from(monthlyTotals.values()).filter(
      (value) => value >= activity.monthlyGoal
    ).length;
  }

  return completed;
};

const maxDayValue = (
  data: AchievementEvaluationData,
  predicate: (activity: Activity) => boolean
) => {
  const activityIds = new Set(data.activities.filter(predicate).map((activity) => activity.id));
  return data.summaries
    .filter((summary) => activityIds.has(summary.activityId))
    .reduce((best, summary) => {
      const activity = data.activities.find((item) => item.id === summary.activityId);
      return Math.max(best, getSummaryValueForActivity(summary, activity));
    }, 0);
};

const workoutMilestones = [1, 3, 5, 10, 15, 25, 40, 60, 80, 100, 150, 200];
const repMilestones = [100, 250, 500, 1000, 2500, 5000, 7500, 10_000, 15_000, 25_000];
const activityMilestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000];
const pullUpMilestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
const treadmillMilestones = [
  500, 1000, 3000, 5000, 10_000, 21_100, 42_200, 75_000, 100_000, 250_000, 500_000, 1_000_000
];
const timedMilestones = [60, 180, 300, 600, 1200, 1800, 3600, 7200, 14_400, 36_000];
const streakMilestones = [2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120];
const goalMilestones = [1, 3, 5, 10, 20, 35, 50, 75, 100, 150];
const levelMilestones = [2, 3, 5, 8, 10, 15, 20, 30];
const xpMilestones = [100, 250, 500, 1000, 2500, 5000, 10_000, 25_000];

const createMilestoneDefinitions = (
  category: AchievementCategory,
  slugPrefix: string,
  titlePrefix: string,
  unitLabel: string,
  milestones: number[],
  getProgress: (data: AchievementEvaluationData) => number
): AchievementDefinition[] =>
  milestones.map((target) => ({
    slug: `${slugPrefix}-${target}`,
    title: `${titlePrefix} ${formatMilestone(target)} ${unitLabel}`,
    description: `Reach ${formatMilestone(target)} ${unitLabel}.`,
    category,
    target,
    rewardXP: Math.max(10, Math.floor(target / 50)),
    getProgress
  }));

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  ...createMilestoneDefinitions(
    "First steps",
    "workouts",
    "Complete",
    "workouts",
    workoutMilestones,
    (data) => data.workouts.length
  ),
  ...createMilestoneDefinitions(
    "Strength",
    "total-reps",
    "Log",
    "total reps",
    repMilestones,
    sumReps
  ),
  ...createMilestoneDefinitions(
    "Push-ups",
    "pushups",
    "Push-ups",
    "reps",
    activityMilestones,
    (data) => sumBySlug(data, "pushups")
  ),
  ...createMilestoneDefinitions(
    "Pull-ups",
    "pullups",
    "Pull-ups",
    "reps",
    pullUpMilestones,
    (data) => sumBySlug(data, "pullups")
  ),
  ...createMilestoneDefinitions(
    "Sit-ups",
    "situps",
    "Sit-ups",
    "reps",
    activityMilestones,
    (data) => sumBySlug(data, "situps")
  ),
  ...createMilestoneDefinitions("Squats", "squats", "Squats", "reps", activityMilestones, (data) =>
    sumBySlug(data, "squats")
  ),
  ...createMilestoneDefinitions(
    "Treadmill",
    "treadmill",
    "Treadmill",
    "meters",
    treadmillMilestones,
    sumTreadmillMeters
  ),
  ...createMilestoneDefinitions(
    "Timed activities",
    "timed",
    "Timed",
    "seconds",
    timedMilestones,
    sumTimedSeconds
  ),
  ...createMilestoneDefinitions(
    "Streaks",
    "streak",
    "Hold a",
    "day streak",
    streakMilestones,
    (data) => calculateStreaks(data.workouts.map((workout) => workout.localDate)).best
  ),
  ...createMilestoneDefinitions(
    "Goals",
    "daily-goals",
    "Complete",
    "daily goals",
    goalMilestones,
    completedDailyGoals
  ),
  ...createMilestoneDefinitions(
    "Goals",
    "weekly-goals",
    "Complete",
    "weekly goals",
    [1, 2, 3, 5, 8, 12],
    completedWeeklyGoals
  ),
  ...createMilestoneDefinitions(
    "Goals",
    "monthly-goals",
    "Complete",
    "monthly goals",
    [1, 2, 3, 5],
    completedMonthlyGoals
  ),
  ...createMilestoneDefinitions(
    "XP / Levels",
    "level",
    "Reach level",
    "",
    levelMilestones,
    (data) => data.userProgress?.level ?? 1
  ),
  ...createMilestoneDefinitions(
    "XP / Levels",
    "xp",
    "Earn",
    "XP",
    xpMilestones,
    (data) =>
      data.userProgress?.totalXP ??
      data.workouts.reduce((total, workout) => total + workout.xpAwarded, 0)
  ),
  ...createMilestoneDefinitions(
    "Consistency",
    "active-days",
    "Train on",
    "days",
    [3, 5, 7, 14, 30, 60, 100],
    (data) => new Set(data.workouts.map((workout) => workout.localDate)).size
  ),
  ...createMilestoneDefinitions(
    "Personal records",
    "best-strength-day",
    "Best strength day",
    "reps",
    [50, 100, 200, 300, 500],
    (data) => maxDayValue(data, (activity) => activity.activityType === "strength")
  ),
  ...createMilestoneDefinitions(
    "Personal records",
    "best-cardio-day",
    "Best cardio day",
    "meters",
    [1000, 3000, 5000, 10_000],
    (data) => maxDayValue(data, (activity) => activity.activityType === "cardio")
  ),
  ...createMilestoneDefinitions(
    "Adventure",
    "enemies-defeated",
    "Defeat",
    "enemies",
    [1, 3, 5, 10, 20, 50, 100],
    (data) => data.hero?.defeatedMobCount ?? 0
  ),
  ...createMilestoneDefinitions(
    "Bosses",
    "bosses-defeated",
    "Defeat",
    "bosses",
    [1, 2, 4, 6, 8, 10, 12],
    (data) =>
      data.hero?.defeatedBossCount ??
      data.bosses?.filter((boss) => boss.status === "defeated").length ??
      0
  ),
  ...createMilestoneDefinitions(
    "Chests",
    "chests-opened",
    "Open",
    "chests",
    [1, 2, 3, 5, 8, 12],
    (data) => data.chests?.filter((chest) => chest.status === "opened").length ?? 0
  ),
  ...createMilestoneDefinitions(
    "Skills",
    "skill-levels",
    "Spend",
    "skill levels",
    [1, 3, 5, 10, 15, 25, 40],
    (data) => data.skills?.reduce((total, skill) => total + Math.max(0, skill.level - 1), 0) ?? 0
  ),
  {
    slug: "100-total-reps",
    title: "100 Total Reps",
    description: "Log 100 total reps across strength activities.",
    category: "Strength",
    target: 100,
    getProgress: sumReps
  },
  {
    slug: "500-total-reps",
    title: "500 Total Reps",
    description: "Log 500 total reps across strength activities.",
    category: "Strength",
    target: 500,
    getProgress: sumReps
  },
  {
    slug: "1000-total-reps",
    title: "1000 Total Reps",
    description: "Log 1000 total reps across strength activities.",
    category: "Strength",
    target: 1000,
    getProgress: sumReps
  },
  {
    slug: "first-workout",
    title: "First Workout",
    description: "Complete your first workout.",
    category: "First steps",
    target: 1,
    getProgress: (data) => data.workouts.length
  },
  {
    slug: "10-workouts",
    title: "10 Workouts",
    description: "Complete 10 workouts.",
    category: "First steps",
    target: 10,
    getProgress: (data) => data.workouts.length
  },
  {
    slug: "7-day-streak",
    title: "7 Day Streak",
    description: "Train on seven consecutive local dates.",
    category: "Streaks",
    target: 7,
    rewardSkillPoints: 1,
    getProgress: (data) => calculateStreaks(data.workouts.map((workout) => workout.localDate)).best
  },
  {
    slug: "new-personal-best",
    title: "New Personal Best",
    description: "Record a new personal best for any activity.",
    category: "Personal records",
    target: 1,
    getProgress: (data) =>
      data.summaries.some(
        (summary) => (summary.bestSet ?? 0) > 0 || (summary.bestDistanceMeters ?? 0) > 0
      )
        ? 1
        : 0
  },
  {
    slug: "first-custom-activity",
    title: "First Custom Activity",
    description: "Create your first custom activity.",
    category: "First steps",
    target: 1,
    rewardSkillPoints: 1,
    getProgress: (data) => (data.activities.some((activity) => !activity.isDefault) ? 1 : 0)
  },
  {
    slug: "first-timed-activity",
    title: "First Timed Activity",
    description: "Complete your first timed activity workout.",
    category: "Timed activities",
    target: 1,
    getProgress: (data) =>
      data.workouts.some((workout) =>
        data.activities.some(
          (activity) => activity.id === workout.activityId && activity.unit === "seconds"
        )
      )
        ? 1
        : 0
  },
  {
    slug: "weekly-goal-completed",
    title: "Weekly Goal Completed",
    description: "Complete a weekly goal for any activity.",
    category: "Goals",
    target: 1,
    getProgress: completedWeeklyGoals
  },
  {
    slug: "monthly-goal-completed",
    title: "Monthly Goal Completed",
    description: "Complete a monthly goal for any activity.",
    category: "Goals",
    target: 1,
    getProgress: completedMonthlyGoals
  }
];

export const evaluateAchievements = (
  data: AchievementEvaluationData,
  existing: Achievement[],
  nowIso: string
): Achievement[] => {
  const existingBySlug = new Map(existing.map((achievement) => [achievement.slug, achievement]));
  const uniqueDefinitions = Array.from(
    new Map(ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.slug, definition])).values()
  );

  return uniqueDefinitions.map((definition) => {
    const current = definition.getProgress(data);
    const target = definition.target ?? 1;
    const previous = existingBySlug.get(definition.slug);
    const unlockedAt = previous?.unlockedAt ?? (current >= target ? nowIso : undefined);
    const achievement: Achievement = {
      id: definition.slug,
      slug: definition.slug,
      title: definition.title.trim(),
      description: definition.description,
      category: definition.category,
      progressCurrent: Math.min(current, target),
      progressTarget: target
    };

    if (definition.rewardXP !== undefined) {
      achievement.rewardXP = definition.rewardXP;
    }
    if (definition.rewardSkillPoints !== undefined) {
      achievement.rewardSkillPoints = definition.rewardSkillPoints;
    }
    if (unlockedAt) {
      achievement.unlockedAt = unlockedAt;
    }

    return achievement;
  });
};

function formatMilestone(value: number) {
  return value.toLocaleString("en-US");
}
