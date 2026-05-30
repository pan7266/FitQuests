import type { AppTab } from "../stores/appStore";

export interface AppRoute {
  id: AppTab;
  label: string;
}

export const appRoutes: AppRoute[] = [
  { id: "home", label: "Home" },
  { id: "adventure", label: "Adventure" },
  { id: "train", label: "Train" },
  { id: "progress", label: "Progress" },
  { id: "settings", label: "Settings" }
];
