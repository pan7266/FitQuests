import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EXERCISE_EQUIPMENT,
  EXERCISE_MUSCLE_GROUPS,
  type ExerciseLibraryItem,
  PREBUILT_EXERCISES
} from "../../data/exerciseLibrary";
import type { ActivityUnit, AppLanguage } from "../../db/schema";
import { cn } from "../../utils/classNames";
import { translate } from "../../utils/i18n";
import { ExerciseIllustration } from "./ExerciseIllustration";

interface AddActivityModalProps {
  appLanguage: AppLanguage;
  onClose: () => void;
  onCreateManual: (input: { name: string; unit: ActivityUnit }) => Promise<void>;
  onSelectExercise: (exercise: ExerciseLibraryItem) => Promise<void>;
}

export function AddActivityModal({
  appLanguage,
  onClose,
  onCreateManual,
  onSelectExercise
}: AddActivityModalProps) {
  const t = (key: string) => translate(appLanguage, key);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [manualName, setManualName] = useState("");
  const [manualUnit, setManualUnit] = useState<ActivityUnit>("reps");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return PREBUILT_EXERCISES.filter((exercise) => {
      const exerciseName = appLanguage === "el" ? exercise.nameEl : exercise.name;
      const matchesQuery =
        !normalized ||
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.nameEl.toLowerCase().includes(normalized);
      const matchesMuscle = muscle === "all" || exercise.muscleGroups.includes(muscle);
      const matchesEquipment = equipment === "all" || exercise.equipment.includes(equipment);
      return matchesQuery && matchesMuscle && matchesEquipment && exerciseName;
    });
  }, [appLanguage, equipment, muscle, query]);

  return (
    <div
      aria-labelledby="add-activity-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/58 p-3 backdrop-blur-sm sm:items-center"
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div className="app-card max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-hidden rounded-[1.75rem]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-soft)] p-4">
          <div>
            <h2 className="text-app text-2xl font-black" id="add-activity-title">
              {t("activityLibrary.addActivity")}
            </h2>
            <p className="text-app-soft mt-1 text-sm leading-6">
              {t("activityLibrary.sourceNote")}
            </p>
          </div>
          <button
            aria-label={t("common.close")}
            className="focus-ring rounded-xl bg-[var(--surface-inset)] p-2 text-app"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="grid max-h-[calc(100dvh-8rem)] gap-0 overflow-auto lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="text-app-soft mb-2 block text-sm font-bold">
                {t("activityLibrary.search")}
              </span>
              <span className="app-inset flex min-h-12 items-center gap-2 rounded-2xl px-3">
                <Search aria-hidden="true" className="text-[var(--accent)]" size={17} />
                <input
                  className="min-h-10 flex-1 bg-transparent text-base text-app outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("activityLibrary.searchPlaceholder")}
                  value={query}
                />
              </span>
            </label>

            <FilterRow
              label={t("activityLibrary.muscleGroup")}
              options={EXERCISE_MUSCLE_GROUPS}
              t={t}
              value={muscle}
              onChange={setMuscle}
            />
            <FilterRow
              label={t("activityLibrary.equipment")}
              options={EXERCISE_EQUIPMENT}
              t={t}
              value={equipment}
              onChange={setEquipment}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((exercise) => (
                <button
                  className="focus-ring app-inset flex min-h-44 flex-col overflow-hidden rounded-2xl p-2 text-left transition hover:border-[var(--accent)] hover:bg-[var(--hover-soft)]"
                  key={exercise.id}
                  onClick={() => void onSelectExercise(exercise)}
                  type="button"
                >
                  <span className="block aspect-[4/3] overflow-hidden rounded-xl">
                    <ExerciseIllustration
                      activity={{
                        id: exercise.id,
                        slug: exercise.id,
                        name: exercise.name,
                        unit: exercise.unit,
                        activityType: getActivityType(exercise.unit),
                        icon: exercise.icon,
                        color: "var(--accent)",
                        defaultRestSeconds: 45,
                        autoRestEnabled: false,
                        dailyGoal: 0,
                        weeklyGoal: 0,
                        monthlyGoal: 0,
                        yearlyGoal: 0,
                        isDefault: false,
                        isArchived: false,
                        createdAt: "",
                        updatedAt: ""
                      }}
                    />
                  </span>
                  <span className="text-app mt-2 block font-black">
                    {appLanguage === "el" ? exercise.nameEl : exercise.name}
                  </span>
                  <span className="text-app-soft mt-1 block text-xs">
                    {exercise.muscleGroups.join(", ")} · {exercise.equipment.join(", ")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside className="border-t border-[var(--border-soft)] p-4 lg:border-l lg:border-t-0">
            <h3 className="text-app text-lg font-black">{t("activityLibrary.manualActivity")}</h3>
            <p className="text-app-soft mt-1 text-sm leading-6">
              {t("activityLibrary.manualActivityCopy")}
            </p>
            <label className="mt-4 block">
              <span className="text-app-soft mb-2 block text-sm font-bold">
                {t("settings.name")}
              </span>
              <input
                className="focus-ring app-inset min-h-12 w-full rounded-2xl px-3 text-base text-app"
                onChange={(event) => setManualName(event.target.value)}
                value={manualName}
              />
            </label>
            <fieldset className="mt-4">
              <legend className="text-app-soft mb-2 text-sm font-bold">{t("settings.unit")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["reps", "seconds", "distance", "weight"] as const).map((unit) => (
                  <button
                    aria-pressed={manualUnit === unit}
                    className={cn(
                      "focus-ring min-h-11 rounded-xl px-3 text-sm font-black",
                      manualUnit === unit
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : "app-inset text-app"
                    )}
                    key={unit}
                    onClick={() => setManualUnit(unit)}
                    type="button"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              className="focus-ring mt-4 min-h-11 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] disabled:opacity-50"
              disabled={!manualName.trim()}
              onClick={() => void onCreateManual({ name: manualName, unit: manualUnit })}
              type="button"
            >
              {t("common.addActivity")}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
  t
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <fieldset>
      <legend className="text-app-soft mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {["all", ...options].map((option) => (
          <button
            aria-pressed={value === option}
            className={cn(
              "focus-ring rounded-xl px-3 py-2 text-xs font-black capitalize",
              value === option
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "app-inset text-app-soft"
            )}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option === "all" ? t("common.all") : option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function getActivityType(unit: ActivityUnit) {
  if (unit === "seconds") {
    return "timed" as const;
  }
  if (unit === "distance") {
    return "cardio" as const;
  }
  return "strength" as const;
}
