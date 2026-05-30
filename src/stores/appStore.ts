import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

export type AppTab = "home" | "adventure" | "train" | "progress" | "settings";
export interface ActiveBattleView {
  enemyId: string;
}

interface AppStore {
  activeTab: AppTab;
  activeBattle: ActiveBattleView | undefined;
  selectedActivityId: string | "all";
  selectedDate: string;
  selectedWorkoutId: string | undefined;
  setActiveTab: (tab: AppTab) => void;
  setActiveBattle: (battle?: ActiveBattleView) => void;
  setSelectedActivityId: (activityId: string | "all") => void;
  setSelectedDate: (localDate: string) => void;
  setSelectedWorkoutId: (workoutId?: string) => void;
}

const initializer: StateCreator<AppStore> = (set) => ({
  activeTab: "home",
  activeBattle: undefined,
  selectedActivityId: "all",
  selectedDate: new Date().toISOString().slice(0, 10),
  selectedWorkoutId: undefined,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveBattle: (battle) => set({ activeBattle: battle }),
  setSelectedActivityId: (activityId) => set({ selectedActivityId: activityId }),
  setSelectedDate: (localDate) => set({ selectedDate: localDate }),
  setSelectedWorkoutId: (workoutId) => set({ selectedWorkoutId: workoutId })
});

export const useAppStore = import.meta.env.DEV
  ? create<AppStore>()(devtools(initializer, { name: "Fit Quest App" }))
  : create<AppStore>()(initializer);
