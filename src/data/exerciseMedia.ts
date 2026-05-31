export interface ExerciseMedia {
  imageSrc: string;
  imageAltKey: string;
  sourceName: string;
  sourceUrl: string;
}

const exerciseMediaBySlug: Record<string, ExerciseMedia> = {
  "push-ups": {
    imageSrc: "/exercise-images/push-ups-0.jpg",
    imageAltKey: "activities.pushups",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  pushups: {
    imageSrc: "/exercise-images/push-ups-0.jpg",
    imageAltKey: "activities.pushups",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  "pull-ups": {
    imageSrc: "/exercise-images/pull-ups-0.jpg",
    imageAltKey: "activities.pullups",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  pullups: {
    imageSrc: "/exercise-images/pull-ups-0.jpg",
    imageAltKey: "activities.pullups",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  "sit-ups": {
    imageSrc: "/exercise-images/sit-ups-0.jpg",
    imageAltKey: "activities.situps",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  situps: {
    imageSrc: "/exercise-images/sit-ups-0.jpg",
    imageAltKey: "activities.situps",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  squats: {
    imageSrc: "/exercise-images/squats-0.jpg",
    imageAltKey: "activities.squats",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  treadmill: {
    imageSrc: "/exercise-images/treadmill-0.jpg",
    imageAltKey: "activities.treadmill",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  },
  plank: {
    imageSrc: "/exercise-images/plank-0.jpg",
    imageAltKey: "activities.plank",
    sourceName: "wrkout/exercises.json",
    sourceUrl: "https://github.com/wrkout/exercises.json"
  }
};

export const getExerciseMedia = (slug: string) => exerciseMediaBySlug[slug];
