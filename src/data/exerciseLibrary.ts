import type { ActivityUnit } from "../db/schema";

export type ExerciseLibrarySource = "ExerciseDB" | "wrkout";

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  nameEl: string;
  unit: ActivityUnit;
  muscleGroups: string[];
  equipment: string[];
  icon: string;
  source: ExerciseLibrarySource;
}

export const PREBUILT_EXERCISES: ExerciseLibraryItem[] = [
  {
    id: "push-up",
    name: "Push-up",
    nameEl: "Κάμψη",
    unit: "reps",
    muscleGroups: ["chest", "triceps", "shoulders"],
    equipment: ["bodyweight"],
    icon: "BadgePlus",
    source: "ExerciseDB"
  },
  {
    id: "pull-up",
    name: "Pull-up",
    nameEl: "Έλξη",
    unit: "reps",
    muscleGroups: ["back", "biceps"],
    equipment: ["pull-up bar"],
    icon: "ArrowUp",
    source: "ExerciseDB"
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    nameEl: "Κάθισμα με βάρος σώματος",
    unit: "reps",
    muscleGroups: ["quads", "glutes", "legs"],
    equipment: ["bodyweight"],
    icon: "MoveDown",
    source: "ExerciseDB"
  },
  {
    id: "sit-up",
    name: "Sit-up",
    nameEl: "Κοιλιακός",
    unit: "reps",
    muscleGroups: ["abs", "core"],
    equipment: ["bodyweight"],
    icon: "CircleDot",
    source: "wrkout"
  },
  {
    id: "plank",
    name: "Plank",
    nameEl: "Σανίδα",
    unit: "seconds",
    muscleGroups: ["core", "abs"],
    equipment: ["bodyweight"],
    icon: "Timer",
    source: "ExerciseDB"
  },
  {
    id: "wall-sit",
    name: "Wall Sit",
    nameEl: "Κάθισμα στον τοίχο",
    unit: "seconds",
    muscleGroups: ["quads", "glutes", "legs"],
    equipment: ["bodyweight"],
    icon: "Timer",
    source: "wrkout"
  },
  {
    id: "jumping-jacks",
    name: "Jumping Jacks",
    nameEl: "Αλματάκια",
    unit: "reps",
    muscleGroups: ["cardio", "full body"],
    equipment: ["bodyweight"],
    icon: "Sparkles",
    source: "ExerciseDB"
  },
  {
    id: "burpee",
    name: "Burpee",
    nameEl: "Burpee",
    unit: "reps",
    muscleGroups: ["cardio", "full body"],
    equipment: ["bodyweight"],
    icon: "Flame",
    source: "ExerciseDB"
  },
  {
    id: "dumbbell-curl",
    name: "Dumbbell Curl",
    nameEl: "Κάμψη δικεφάλων με αλτήρες",
    unit: "weight",
    muscleGroups: ["biceps", "arms"],
    equipment: ["dumbbells"],
    icon: "Dumbbell",
    source: "wrkout"
  },
  {
    id: "dumbbell-press",
    name: "Dumbbell Shoulder Press",
    nameEl: "Πιέσεις ώμων με αλτήρες",
    unit: "weight",
    muscleGroups: ["shoulders", "triceps"],
    equipment: ["dumbbells"],
    icon: "Dumbbell",
    source: "ExerciseDB"
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    nameEl: "Αιώρηση kettlebell",
    unit: "weight",
    muscleGroups: ["glutes", "hamstrings", "core"],
    equipment: ["kettlebell"],
    icon: "Dumbbell",
    source: "ExerciseDB"
  },
  {
    id: "treadmill-run",
    name: "Treadmill Run",
    nameEl: "Τρέξιμο στον διάδρομο",
    unit: "distance",
    muscleGroups: ["cardio", "legs"],
    equipment: ["treadmill"],
    icon: "Footprints",
    source: "ExerciseDB"
  }
];

export const EXERCISE_MUSCLE_GROUPS = Array.from(
  new Set(PREBUILT_EXERCISES.flatMap((exercise) => exercise.muscleGroups))
).sort();

export const EXERCISE_EQUIPMENT = Array.from(
  new Set(PREBUILT_EXERCISES.flatMap((exercise) => exercise.equipment))
).sort();
