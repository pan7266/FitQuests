import type { Activity, Workout, WorkoutCardioMetric, WorkoutSet } from "../../db/schema";
import { formatDisplayDateTime, formatDuration, formatDurationWords } from "../../utils/dates";
import { calculateBaseXP } from "../../utils/stats";
import { calculateWorkoutTotals } from "../../utils/workoutMetrics";
import { NeomorphicButton } from "../neumorphic/NeomorphicButton";

interface WorkoutSummaryProps {
  workout: Workout;
  sets: WorkoutSet[];
  cardioMetric?: WorkoutCardioMetric | undefined;
  activity?: Activity | undefined;
  onDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStartAnother: () => void;
  compactEnd?: boolean;
}

export function WorkoutSummary({
  workout,
  sets,
  cardioMetric,
  activity,
  onDone,
  onEdit,
  onDelete,
  onStartAnother,
  compactEnd = false
}: WorkoutSummaryProps) {
  const setTotals = calculateWorkoutTotals(sets);
  const isCardio = activity?.activityType === "cardio";
  const metricValue = isCardio ? (cardioMetric?.distanceMeters ?? 0) : setTotals.totalValue;
  const valueLabel = activity?.unit === "seconds" ? "seconds" : isCardio ? "km" : "reps";
  const totalDisplay =
    activity?.unit === "seconds"
      ? formatDuration(setTotals.totalValue)
      : isCardio
        ? ((cardioMetric?.distanceMeters ?? 0) / 1000).toFixed(2)
        : String(setTotals.totalValue);
  const bestSetDisplay =
    activity?.unit === "seconds" ? formatDuration(setTotals.bestSet) : String(setTotals.bestSet);
  const baseXP = activity ? calculateBaseXP(activity.unit, metricValue) : workout.xpAwarded;
  const bonusXP = Math.max(0, workout.xpAwarded - baseXP);

  return (
    <section className="space-y-4">
      <div className="app-card rounded-[1.75rem] p-5 text-center">
        <p className="text-sm font-bold text-[var(--accent)]">{activity?.name ?? "Workout"}</p>
        <h2 className="text-app mt-2 text-4xl font-black">
          {totalDisplay} {valueLabel}
        </h2>
        <p className="text-app-muted mt-2 text-sm">{formatDisplayDateTime(workout.startedAt)}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {(isCardio ? (cardioMetric?.distanceMeters ?? 0) > 0 : setTotals.bestSet > 0) ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
              Personal best check
            </span>
          ) : null}
          {bonusXP > 0 ? (
            <span className="rounded-full bg-[#22C55E]/14 px-3 py-1 text-xs font-bold text-[#86EFAC]">
              Bonus XP +{bonusXP}
            </span>
          ) : null}
        </div>
      </div>
      {isCardio ? (
        <div className="grid grid-cols-2 gap-3">
          <SummaryMetric
            label="Distance"
            value={`${((cardioMetric?.distanceMeters ?? 0) / 1000).toFixed(2)} km`}
          />
          <SummaryMetric
            label="Duration"
            value={formatDurationWords(cardioMetric?.durationSeconds ?? workout.durationSeconds)}
          />
          <SummaryMetric
            label="Speed"
            value={
              cardioMetric?.averageSpeedKmh
                ? `${cardioMetric.averageSpeedKmh.toFixed(1)} km/h`
                : "--"
            }
          />
          <SummaryMetric label="XP Earned" value={String(workout.xpAwarded)} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <SummaryMetric label="Sets" value={String(setTotals.totalSets)} />
          <SummaryMetric label="Best Set" value={bestSetDisplay} />
          <SummaryMetric label="Duration" value={formatDurationWords(workout.durationSeconds)} />
          <SummaryMetric label="XP Earned" value={String(workout.xpAwarded)} />
        </div>
      )}
      <div className="app-card rounded-[1.75rem] p-4">
        <h3 className="text-app font-bold">{isCardio ? "Cardio Metrics" : "Sets"}</h3>
        <div className="mt-3 space-y-2">
          {isCardio ? (
            <>
              <SummaryRow
                label="Distance"
                value={`${((cardioMetric?.distanceMeters ?? 0) / 1000).toFixed(2)} km`}
              />
              <SummaryRow
                label="Duration"
                value={formatDuration(cardioMetric?.durationSeconds ?? workout.durationSeconds)}
              />
              <SummaryRow
                label="Pace"
                value={
                  cardioMetric?.paceSecondsPerKm
                    ? `${formatDuration(cardioMetric.paceSecondsPerKm)}/km`
                    : "--"
                }
              />
              <SummaryRow
                label="Speed"
                value={
                  cardioMetric?.averageSpeedKmh
                    ? `${cardioMetric.averageSpeedKmh.toFixed(1)} km/h`
                    : "--"
                }
              />
              <SummaryRow
                label="Incline"
                value={
                  cardioMetric?.inclinePercent !== undefined
                    ? `${cardioMetric.inclinePercent.toFixed(1)}%`
                    : "--"
                }
              />
              {cardioMetric?.averageHeartRate ? (
                <SummaryRow label="Avg heart rate" value={`${cardioMetric.averageHeartRate} bpm`} />
              ) : null}
              {cardioMetric?.maxHeartRate ? (
                <SummaryRow label="Max heart rate" value={`${cardioMetric.maxHeartRate} bpm`} />
              ) : null}
              {cardioMetric?.perceivedEffort ? (
                <SummaryRow label="Effort" value={`${cardioMetric.perceivedEffort}/10`} />
              ) : null}
            </>
          ) : (
            sets.map((set) => (
              <SummaryRow
                key={set.id}
                label={`Set ${set.setIndex}`}
                value={activity?.unit === "seconds" ? formatDuration(set.value) : String(set.value)}
              />
            ))
          )}
        </div>
      </div>
      {compactEnd ? (
        <NeomorphicButton className="w-full" onClick={onDone} variant="primary">
          Continue
        </NeomorphicButton>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <NeomorphicButton onClick={onDone} variant="primary">
            Done
          </NeomorphicButton>
          <NeomorphicButton onClick={onEdit} variant="secondary">
            Edit Workout
          </NeomorphicButton>
          <NeomorphicButton onClick={onDelete} variant="danger">
            Delete
          </NeomorphicButton>
          <NeomorphicButton onClick={onStartAnother} variant="secondary">
            Start Another
          </NeomorphicButton>
        </div>
      )}
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card rounded-3xl p-4">
      <p className="text-app-muted text-xs font-bold uppercase tracking-[0.16em]">{label}</p>
      <p className="text-app mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-inset flex justify-between rounded-2xl px-4 py-3">
      <span className="text-app-muted">{label}</span>
      <span className="text-app font-bold">{value}</span>
    </div>
  );
}
