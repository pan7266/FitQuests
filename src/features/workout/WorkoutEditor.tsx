import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { NeomorphicButton } from "../../components/neumorphic/NeomorphicButton";
import {
  updateCompletedCardioWorkout,
  updateCompletedWorkout,
  type WorkoutWithSets
} from "../../db/repositories/workoutsRepo";
import type { Activity, WorkoutSet } from "../../db/schema";
import { nowIso } from "../../utils/dates";
import { createId } from "../../utils/ids";

interface WorkoutEditorProps {
  workoutWithSets: WorkoutWithSets;
  activity?: Activity | undefined;
  onClose: () => void;
}

const parseNonNegative = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const parseOptionalNonNegative = (value: string) => {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
};

export function WorkoutEditor({ workoutWithSets, activity, onClose }: WorkoutEditorProps) {
  const [notes, setNotes] = useState(workoutWithSets.workout.notes ?? "");
  const [sets, setSets] = useState<WorkoutSet[]>(workoutWithSets.sets);
  const [newSetValue, setNewSetValue] = useState("");
  const [distanceKm, setDistanceKm] = useState(
    workoutWithSets.cardioMetric
      ? (workoutWithSets.cardioMetric.distanceMeters / 1000).toString()
      : ""
  );
  const [durationMinutes, setDurationMinutes] = useState(
    workoutWithSets.cardioMetric
      ? (workoutWithSets.cardioMetric.durationSeconds / 60).toString()
      : ""
  );
  const [speed, setSpeed] = useState(
    workoutWithSets.cardioMetric?.averageSpeedKmh?.toString() ?? ""
  );
  const [incline, setIncline] = useState(
    workoutWithSets.cardioMetric?.inclinePercent?.toString() ?? ""
  );
  const [heartRate, setHeartRate] = useState(
    workoutWithSets.cardioMetric?.averageHeartRate?.toString() ?? ""
  );
  const [effort, setEffort] = useState<number | undefined>(
    workoutWithSets.cardioMetric?.perceivedEffort
  );
  const isCardio = activity?.activityType === "cardio";

  const updateSetValue = (id: string, value: number) => {
    setSets((current) =>
      current.map((set) =>
        set.id === id ? { ...set, value: Math.max(0, Math.floor(value)) } : set
      )
    );
  };

  const addSet = () => {
    const value = Number(newSetValue);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    const now = nowIso();
    setSets((current) => [
      ...current,
      {
        id: createId(),
        workoutId: workoutWithSets.workout.id,
        activityId: workoutWithSets.workout.activityId,
        setIndex: current.length + 1,
        value: Math.floor(value),
        startedAt: now,
        endedAt: now,
        localDate: workoutWithSets.workout.localDate,
        durationSeconds: activity?.unit === "seconds" ? Math.floor(value) : 0
      }
    ]);
    setNewSetValue("");
  };

  const save = async () => {
    if (isCardio) {
      const parsedSpeed = parseOptionalNonNegative(speed);
      const parsedIncline = parseOptionalNonNegative(incline);
      const parsedHeartRate = parseOptionalNonNegative(heartRate);
      await updateCompletedCardioWorkout(workoutWithSets.workout.id, {
        notes,
        distanceMeters: parseNonNegative(distanceKm) * 1000,
        durationSeconds: parseNonNegative(durationMinutes) * 60,
        ...(parsedSpeed !== undefined ? { averageSpeedKmh: parsedSpeed } : {}),
        ...(parsedIncline !== undefined ? { inclinePercent: parsedIncline } : {}),
        ...(parsedHeartRate !== undefined ? { averageHeartRate: parsedHeartRate } : {}),
        ...(effort ? { perceivedEffort: effort } : {})
      });
      onClose();
      return;
    }

    await updateCompletedWorkout(workoutWithSets.workout.id, { notes, sets });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080B12]/96 p-4 pt-[calc(var(--safe-top)+1rem)]">
      <section className="app-card mx-auto max-w-md rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">{activity?.name ?? "Workout"}</p>
            <h2 className="text-xl font-black text-[#F8FAFC]">Edit Workout</h2>
          </div>
          <button
            className="focus-ring rounded-2xl p-2 hover:bg-white/6"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={22} />
            <span className="sr-only">Close editor</span>
          </button>
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-bold text-[#CBD5E1]">Notes</span>
          <textarea
            className="focus-ring app-inset min-h-24 w-full rounded-2xl p-4 text-[#F8FAFC]"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>
        {isCardio ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <NumberInput
              label="Distance (km)"
              onChange={setDistanceKm}
              step="0.01"
              value={distanceKm}
            />
            <NumberInput
              label="Duration (minutes)"
              onChange={setDurationMinutes}
              step="0.1"
              value={durationMinutes}
            />
            <NumberInput
              label="Average speed (km/h)"
              onChange={setSpeed}
              step="0.1"
              value={speed}
            />
            <NumberInput label="Incline (%)" onChange={setIncline} step="0.1" value={incline} />
            <NumberInput
              label="Avg heart rate"
              onChange={setHeartRate}
              step="1"
              value={heartRate}
            />
            <fieldset>
              <legend className="mb-2 block text-sm font-bold text-[#CBD5E1]">Effort</legend>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <button
                    aria-pressed={effort === value}
                    className={`focus-ring min-h-10 rounded-xl text-sm font-black ${
                      effort === value
                        ? "bg-[var(--accent)] text-white shadow-[var(--accent-glow)]"
                        : "app-inset text-[#F8FAFC]"
                    }`}
                    key={value}
                    onClick={() => setEffort(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-2">
              {sets.map((set, index) => (
                <div
                  className="app-inset grid grid-cols-[1fr_auto] gap-2 rounded-2xl p-3"
                  key={set.id}
                >
                  <label>
                    <span className="mb-1 block text-xs font-bold text-[#94A3B8]">
                      Set {index + 1}
                    </span>
                    <input
                      className="focus-ring w-full rounded-xl bg-transparent px-2 py-2 text-[#F8FAFC]"
                      min={0}
                      onChange={(event) => updateSetValue(set.id, Number(event.target.value))}
                      type="number"
                      value={set.value}
                    />
                  </label>
                  <button
                    aria-label={`Delete set ${index + 1}`}
                    className="focus-ring self-end rounded-xl p-3 text-[#F43F5E] hover:bg-[#F43F5E]/10"
                    onClick={() =>
                      setSets((current) => current.filter((item) => item.id !== set.id))
                    }
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <label>
                <span className="mb-2 block text-sm font-bold text-[#CBD5E1]">
                  Missing set value
                </span>
                <input
                  className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                  min={1}
                  onChange={(event) => setNewSetValue(event.target.value)}
                  type="number"
                  value={newSetValue}
                />
              </label>
              <button
                aria-label="Add missing set"
                className="focus-ring mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[var(--accent-glow)]"
                onClick={addSet}
                type="button"
              >
                <Plus aria-hidden="true" size={20} />
              </button>
            </div>
          </>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <NeomorphicButton onClick={onClose} variant="secondary">
            Cancel
          </NeomorphicButton>
          <NeomorphicButton onClick={save} variant="primary">
            Save
          </NeomorphicButton>
        </div>
      </section>
    </div>
  );
}

function NumberInput({
  label,
  value,
  step,
  onChange
}: {
  label: string;
  value: string;
  step: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#CBD5E1]">{label}</span>
      <input
        className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
        inputMode="decimal"
        min={0}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}
