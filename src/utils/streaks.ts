import { differenceInCalendarDays, subDays } from "date-fns";
import { parseLocalDate, toLocalDate } from "./dates";

export interface StreakResult {
  current: number;
  best: number;
}

export const calculateStreaks = (
  workoutLocalDates: string[],
  anchorDate = new Date()
): StreakResult => {
  const uniqueDates = Array.from(new Set(workoutLocalDates)).sort();

  if (uniqueDates.length === 0) {
    return { current: 0, best: 0 };
  }

  let best = 1;
  let run = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = uniqueDates[index - 1];
    const current = uniqueDates[index];

    if (
      previous &&
      current &&
      differenceInCalendarDays(parseLocalDate(current), parseLocalDate(previous)) === 1
    ) {
      run += 1;
    } else {
      run = 1;
    }

    best = Math.max(best, run);
  }

  const today = toLocalDate(anchorDate);
  const yesterday = toLocalDate(subDays(anchorDate, 1));
  let cursor = uniqueDates.includes(today)
    ? today
    : uniqueDates.includes(yesterday)
      ? yesterday
      : "";
  let current = 0;

  while (cursor && uniqueDates.includes(cursor)) {
    current += 1;
    cursor = toLocalDate(subDays(parseLocalDate(cursor), 1));
  }

  return { current, best };
};
