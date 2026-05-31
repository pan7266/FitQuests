import { BarChart3, Dumbbell, Home, Map as MapIcon, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { appRoutes } from "../../app/router";
import { listAdventureState } from "../../db/repositories/adventureRepo";
import type { AppTab } from "../../stores/appStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../utils/classNames";
import { translate } from "../../utils/i18n";

interface BottomNavProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const icons = {
  home: Home,
  adventure: MapIcon,
  train: Dumbbell,
  progress: BarChart3,
  settings: Settings
};

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const [skillPoints, setSkillPoints] = useState(0);
  const labels: Record<AppTab, string> = {
    home: translate(appLanguage, "common.home"),
    adventure: translate(appLanguage, "common.adventure"),
    train: translate(appLanguage, "common.train"),
    progress: translate(appLanguage, "common.progress"),
    settings: translate(appLanguage, "common.settings")
  };

  useEffect(() => {
    let mounted = true;
    const refreshSkillPoints = () => {
      listAdventureState()
        .then((adventure) => {
          if (mounted) {
            setSkillPoints(adventure.hero?.unspentSkillPoints ?? 0);
          }
        })
        .catch(() => {
          if (mounted) {
            setSkillPoints(0);
          }
        });
    };

    refreshSkillPoints();
    window.addEventListener("fit-quest-adventure-updated", refreshSkillPoints);

    return () => {
      mounted = false;
      window.removeEventListener("fit-quest-adventure-updated", refreshSkillPoints);
    };
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] px-3 pb-[calc(var(--safe-bottom)+0.45rem)] pt-2 shadow-[0_-14px_34px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.45rem] lg:max-w-3xl">
        {appRoutes.map((route) => {
          const Icon = icons[route.id];
          const isActive = route.id === activeTab;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "focus-ring flex min-h-13 flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1 text-[0.64rem] font-bold transition active:scale-[0.97]",
                isActive
                  ? "bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-[var(--accent)] shadow-[inset_0_0_0_0.7px_var(--accent)]"
                  : "text-[#94A3B8] hover:bg-[var(--hover-soft)] hover:text-[var(--text-primary)]"
              )}
              key={route.id}
              onClick={() => onChange(route.id)}
              type="button"
            >
              <span className="relative">
                <Icon aria-hidden="true" size={20} />
                {route.id === "adventure" && skillPoints > 0 ? (
                  <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[0.62rem] font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
                    {skillPoints}
                  </span>
                ) : null}
              </span>
              <span>{labels[route.id] ?? route.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
