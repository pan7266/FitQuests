import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DailyActivitySummary } from "../../db/schema";
import { getCalendarMonthDates, toLocalDate } from "../../utils/dates";
import { getSummaryValueForActivity } from "../../utils/workoutMetrics";
import { CalendarDayRing } from "./CalendarDayRing";

interface CalendarMonthProps {
  month: Date;
  summaries: DailyActivitySummary[];
  selectedActivityId: string | "all";
  selectedDate: string;
  onSelectDate: (localDate: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonth({
  month,
  summaries,
  selectedActivityId,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth
}: CalendarMonthProps) {
  const dates = getCalendarMonthDates(month);

  const getDayValue = (localDate: string) => {
    const daySummaries = summaries.filter((summary) => {
      const activityMatches =
        selectedActivityId === "all" || summary.activityId === selectedActivityId;
      return summary.localDate === localDate && activityMatches;
    });
    const value = daySummaries.reduce(
      (total, summary) =>
        total +
        (selectedActivityId === "all"
          ? summary.workoutCount
          : summary.activityType === "cardio"
            ? getSummaryValueForActivity(summary) / 1000
            : getSummaryValueForActivity(summary)),
      0
    );
    const isCardio = selectedActivityId !== "all" && daySummaries[0]?.activityType === "cardio";

    return {
      value,
      valueLabel: isCardio && value > 0 ? `${value.toFixed(1)} km` : String(value)
    };
  };

  return (
    <section className="app-card rounded-[1.75rem] p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          aria-label="Previous month"
          className="focus-ring rounded-2xl p-2 hover:bg-white/6"
          onClick={onPreviousMonth}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </button>
        <h2 className="text-lg font-black text-[#F8FAFC]">{format(month, "MMMM yyyy")}</h2>
        <button
          aria-label="Next month"
          className="focus-ring rounded-2xl p-2 hover:bg-white/6"
          onClick={onNextMonth}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={22} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold uppercase text-[#94A3B8]">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {dates.map((date) => {
          const dayValue = getDayValue(date.localDate);
          return (
            <CalendarDayRing
              isCurrentMonth={date.isCurrentMonth}
              isSelected={date.localDate === selectedDate}
              isToday={date.localDate === toLocalDate()}
              key={date.localDate}
              label={date.day}
              onClick={() => onSelectDate(date.localDate)}
              value={dayValue.value}
              valueLabel={dayValue.valueLabel}
            />
          );
        })}
      </div>
    </section>
  );
}
