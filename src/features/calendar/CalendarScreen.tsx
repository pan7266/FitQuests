import { addMonths, subMonths } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { ActivitySelector } from "../../components/activity/ActivitySelector";
import { EmptyState } from "../../components/feedback/EmptyState";
import { WorkoutSummary } from "../../components/workout/WorkoutSummary";
import { listActivities } from "../../db/repositories/activitiesRepo";
import { listSummaries } from "../../db/repositories/summariesRepo";
import {
  deleteWorkout,
  getWorkoutWithSets,
  listWorkoutCardioMetrics,
  listWorkoutsForLocalDate,
  type WorkoutWithSets
} from "../../db/repositories/workoutsRepo";
import type { Activity, DailyActivitySummary, Workout, WorkoutCardioMetric } from "../../db/schema";
import { useAppStore } from "../../stores/appStore";
import { formatDisplayDate, formatDuration, toLocalDate } from "../../utils/dates";
import { WorkoutEditor } from "../workout/WorkoutEditor";
import { CalendarMonth } from "./CalendarMonth";

export function CalendarScreen() {
  const selectedActivityId = useAppStore((state) => state.selectedActivityId);
  const setSelectedActivityId = useAppStore((state) => state.setSelectedActivityId);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const [month, setMonth] = useState(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summaries, setSummaries] = useState<DailyActivitySummary[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cardioMetrics, setCardioMetrics] = useState<WorkoutCardioMetric[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithSets | undefined>();
  const [editingWorkout, setEditingWorkout] = useState<WorkoutWithSets | undefined>();

  const load = useCallback(async () => {
    const [nextActivities, nextSummaries, nextWorkouts, nextCardioMetrics] = await Promise.all([
      listActivities(),
      listSummaries(),
      listWorkoutsForLocalDate(selectedDate),
      listWorkoutCardioMetrics()
    ]);
    setActivities(nextActivities);
    setSummaries(nextSummaries);
    setWorkouts(nextWorkouts);
    setCardioMetrics(nextCardioMetrics);
  }, [selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredWorkouts = workouts.filter(
    (workout) => selectedActivityId === "all" || workout.activityId === selectedActivityId
  );
  const groupedWorkouts = activities
    .map((activity) => ({
      activity,
      workouts: filteredWorkouts.filter((workout) => workout.activityId === activity.id)
    }))
    .filter((group) => group.workouts.length > 0);
  const hasAnyData = summaries.length > 0;

  if (!hasAnyData) {
    return (
      <EmptyState
        description="Your month grid will light up once you complete workouts on local dates."
        onPrimary={() => setActiveTab("train")}
        primaryLabel="Start Workout"
        title="No workout data yet"
      />
    );
  }

  return (
    <section className="space-y-4 lg:space-y-6">
      <div className="app-card rounded-[1.75rem] p-4 lg:max-w-xl">
        <ActivitySelector
          activities={activities}
          onChange={setSelectedActivityId}
          value={selectedActivityId}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_30rem]">
        <CalendarMonth
          month={month}
          onNextMonth={() => setMonth((current) => addMonths(current, 1))}
          onPreviousMonth={() => setMonth((current) => subMonths(current, 1))}
          onSelectDate={setSelectedDate}
          selectedActivityId={selectedActivityId}
          selectedDate={selectedDate || toLocalDate()}
          summaries={summaries}
        />
        <section className="app-card rounded-[1.75rem] p-4 lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-lg font-black text-[#F8FAFC]">{formatDisplayDate(selectedDate)}</h2>
          <div className="mt-3 space-y-3">
            {filteredWorkouts.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No workouts on this date.</p>
            ) : (
              groupedWorkouts.map((group) => (
                <div className="space-y-2" key={group.activity.id}>
                  <h3 className="px-1 text-sm font-black text-[#CBD5E1]">{group.activity.name}</h3>
                  {group.workouts.map((workout) => (
                    <button
                      className="focus-ring app-inset flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
                      key={workout.id}
                      onClick={async () => setSelectedWorkout(await getWorkoutWithSets(workout.id))}
                      type="button"
                    >
                      <span>
                        <span className="block font-bold text-[#F8FAFC]">
                          {group.activity.name}
                        </span>
                        <span className="text-sm text-[#94A3B8]">
                          {group.activity.activityType === "cardio"
                            ? `${((cardioMetrics.find((metric) => metric.workoutId === workout.id)?.distanceMeters ?? 0) / 1000).toFixed(2)} km · ${formatDuration(cardioMetrics.find((metric) => metric.workoutId === workout.id)?.durationSeconds ?? workout.durationSeconds)}`
                            : "Open details"}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-[var(--accent)]">Open</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      {selectedWorkout ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#080B12]/96 p-4 pt-[calc(var(--safe-top)+1rem)]">
          <div className="mx-auto max-w-md">
            <WorkoutSummary
              activity={activities.find(
                (activity) => activity.id === selectedWorkout.workout.activityId
              )}
              onDelete={async () => {
                if (window.confirm("Delete this workout?")) {
                  await deleteWorkout(selectedWorkout.workout.id);
                  setSelectedWorkout(undefined);
                  await load();
                }
              }}
              onDone={() => setSelectedWorkout(undefined)}
              onEdit={() => setEditingWorkout(selectedWorkout)}
              onStartAnother={() => {
                setSelectedWorkout(undefined);
                setActiveTab("train");
              }}
              sets={selectedWorkout.sets}
              workout={selectedWorkout.workout}
            />
          </div>
        </div>
      ) : null}
      {editingWorkout ? (
        <WorkoutEditor
          activity={activities.find(
            (activity) => activity.id === editingWorkout.workout.activityId
          )}
          onClose={async () => {
            setEditingWorkout(undefined);
            const refreshed = await getWorkoutWithSets(editingWorkout.workout.id);
            setSelectedWorkout(refreshed);
            await load();
          }}
          workoutWithSets={editingWorkout}
        />
      ) : null}
    </section>
  );
}
