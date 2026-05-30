import type { Activity, DailyActivitySummary } from "../db/schema";
import { getSummaryValueForActivity } from "./workoutMetrics";

export type GoalPeriod = "daily" | "weekly" | "monthly" | "yearly";

export const getGoalForPeriod = (activity: Activity, period: GoalPeriod) => {
  if (period === "daily") {
    return activity.dailyGoal;
  }
  if (period === "weekly") {
    return activity.weeklyGoal;
  }
  if (period === "monthly") {
    return activity.monthlyGoal;
  }

  return activity.yearlyGoal;
};

export const getGoalProgressPercent = (value: number, goal: number) => {
  if (goal <= 0) {
    return 0;
  }

  return Math.min(100, (value / goal) * 100);
};

export const hasCompletedGoal = (value: number, goal: number) => goal > 0 && value >= goal;

export const getDailyGoalBonusXP = (value: number, goal: number) => {
  if (goal <= 0 || value < goal) {
    return 0;
  }

  const ratio = value / goal;
  if (ratio >= 3) {
    return 100;
  }
  if (ratio >= 2) {
    return 60;
  }
  if (ratio >= 1.5) {
    return 40;
  }

  return 25;
};

export const sumSummaryValues = (summaries: DailyActivitySummary[]) =>
  summaries.reduce((total, summary) => total + getSummaryValueForActivity(summary), 0);
