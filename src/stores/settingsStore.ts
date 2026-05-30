import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import { getSettings, type SettingsUpdate, updateSettings } from "../db/repositories/settingsRepo";
import type { Settings } from "../db/schema";

interface SettingsStore {
  settings: Settings | undefined;
  isLoaded: boolean;
  loadSettings: () => Promise<Settings>;
  updateSettings: (updates: SettingsUpdate) => Promise<Settings>;
}

let settingsUpdateQueue = Promise.resolve();

const initializer: StateCreator<SettingsStore> = (set, get) => ({
  settings: undefined,
  isLoaded: false,
  loadSettings: async () => {
    const settings = await getSettings();
    set({ settings, isLoaded: true });
    return settings;
  },
  updateSettings: async (updates) => {
    const current = get().settings;
    if (current) {
      set({
        settings: {
          ...current,
          ...updates,
          displayName:
            updates.displayName !== undefined
              ? updates.displayName.trim() || "Player"
              : current.displayName
        },
        isLoaded: true
      });
    }
    const nextUpdate = settingsUpdateQueue
      .catch(() => undefined)
      .then(() => updateSettings(updates));
    settingsUpdateQueue = nextUpdate.then(() => undefined);
    const settings = await nextUpdate;
    set({ settings, isLoaded: true });
    return settings;
  }
});

export const useSettingsStore = import.meta.env.DEV
  ? create<SettingsStore>()(devtools(initializer, { name: "Fit Quest Settings" }))
  : create<SettingsStore>()(initializer);
