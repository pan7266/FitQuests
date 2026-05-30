import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays
} from "date-fns";

export type StatsPeriod = "day" | "week" | "month" | "year" | "all";

export interface DateRange {
  start: string;
  end: string;
}

export const nowIso = () => new Date().toISOString();

export const toDate = (value: Date | string) => (value instanceof Date ? value : parseISO(value));

export const toLocalDate = (value: Date | string = new Date()) =>
  format(toDate(value), "yyyy-MM-dd");

export const parseLocalDate = (localDate: string) => new Date(`${localDate}T00:00:00`);

export const formatDisplayDate = (localDate: string) =>
  format(parseLocalDate(localDate), "MMM d, yyyy");

export const formatDisplayDateTime = (iso: string) => format(parseISO(iso), "MMM d, yyyy h:mm a");

export const formatDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const formatDurationWords = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
};

export const getPeriodRange = (period: StatsPeriod, anchor = new Date()): DateRange => {
  const localDate = toLocalDate(anchor);

  if (period === "day") {
    return { start: localDate, end: localDate };
  }

  if (period === "week") {
    return {
      start: toLocalDate(startOfWeek(anchor, { weekStartsOn: 1 })),
      end: toLocalDate(endOfWeek(anchor, { weekStartsOn: 1 }))
    };
  }

  if (period === "month") {
    return {
      start: toLocalDate(startOfMonth(anchor)),
      end: toLocalDate(endOfMonth(anchor))
    };
  }

  if (period === "year") {
    return {
      start: toLocalDate(startOfYear(anchor)),
      end: toLocalDate(endOfYear(anchor))
    };
  }

  return { start: "0000-01-01", end: "9999-12-31" };
};

export const isLocalDateInRange = (localDate: string, range: DateRange) =>
  localDate >= range.start && localDate <= range.end;

export const getLocalDatesBetween = (start: string, end: string) =>
  eachDayOfInterval({ start: parseLocalDate(start), end: parseLocalDate(end) }).map((date) =>
    toLocalDate(date)
  );

export const getCalendarMonthDates = (anchor = new Date()) => {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
    localDate: toLocalDate(date),
    day: format(date, "d"),
    isCurrentMonth: date.getMonth() === anchor.getMonth()
  }));
};

export const getDaysInLocalMonth = (anchor = new Date()) => getDaysInMonth(anchor);

export const getMonthLabelsBetween = (start: string, end: string) => {
  const labels: string[] = [];
  let cursor = startOfMonth(parseLocalDate(start));
  const final = startOfMonth(parseLocalDate(end));

  while (!isAfter(cursor, final)) {
    labels.push(format(cursor, "yyyy-MM"));
    cursor = addMonths(cursor, 1);
  }

  return labels;
};

export const isTodayOrPast = (localDate: string) => !isAfter(parseLocalDate(localDate), new Date());

export const daysAgo = (localDate: string) =>
  differenceInCalendarDays(new Date(), parseLocalDate(localDate));

export const yesterdayLocalDate = () => toLocalDate(subDays(new Date(), 1));

export const tomorrowLocalDate = () => toLocalDate(addDays(new Date(), 1));

export const minLocalDate = (dates: string[]) => {
  if (dates.length === 0) {
    return toLocalDate();
  }

  return dates.reduce((min, date) =>
    isBefore(parseLocalDate(date), parseLocalDate(min)) ? date : min
  );
};

export const maxLocalDate = (dates: string[]) => {
  if (dates.length === 0) {
    return toLocalDate();
  }

  return dates.reduce((max, date) =>
    isAfter(parseLocalDate(date), parseLocalDate(max)) ? date : max
  );
};
