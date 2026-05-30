import { Lock, Medal } from "lucide-react";
import type { Achievement } from "../../db/schema";
import { useSettingsStore } from "../../stores/settingsStore";
import { translate } from "../../utils/i18n";
import { ProgressRing } from "../activity/ProgressRing";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const t = (key: string) => translate(appLanguage, key);
  const unlocked = Boolean(achievement.unlockedAt);
  const current = achievement.progressCurrent ?? 0;
  const target = achievement.progressTarget ?? 1;

  return (
    <article className="app-card grid grid-cols-[auto_1fr] gap-3 rounded-3xl p-4">
      <ProgressRing
        color={unlocked ? "#22C55E" : "#64748B"}
        label={`${achievement.title} ${t("achievements.progress")}`}
        max={target}
        size={54}
        stroke={6}
        value={current}
      >
        {unlocked ? <Medal aria-hidden="true" size={22} /> : <Lock aria-hidden="true" size={18} />}
      </ProgressRing>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-app font-bold">{achievement.title}</h3>
          <span className="app-pill text-[0.65rem]">{achievement.category}</span>
        </div>
        <p className="text-app-soft mt-1 text-sm leading-5">{achievement.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-app-muted text-xs font-bold">
            {unlocked ? t("common.unlocked") : `${current}/${target}`}
          </span>
          {achievement.rewardXP ? (
            <span className="text-app-muted text-xs font-bold">+{achievement.rewardXP} XP</span>
          ) : null}
          {achievement.rewardSkillPoints ? (
            <span className="text-app-muted text-xs font-bold">
              +{achievement.rewardSkillPoints} {t("profile.skillPoints")}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
