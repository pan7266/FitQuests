import { useCallback, useEffect, useMemo, useState } from "react";
import { listAchievements } from "../../db/repositories/achievementsRepo";
import { listAdventureState } from "../../db/repositories/adventureRepo";
import { getUserProgress } from "../../db/repositories/progressRepo";
import { listSummaries } from "../../db/repositories/summariesRepo";
import { listWorkouts } from "../../db/repositories/workoutsRepo";
import type {
  Achievement,
  AdventureMob,
  AdventureRegion,
  DailyActivitySummary,
  HeroProgress,
  HeroSkill,
  HeroSkillSlug,
  Settings,
  UserProgress,
  Workout
} from "../../db/schema";
import { useAppStore } from "../../stores/appStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../utils/classNames";
import { getAdventureLanguage, translate, translateAdventure } from "../../utils/i18n";
import { getCurrentLevelProgress } from "../../utils/levels";
import { calculateStreaks } from "../../utils/streaks";
import { CharacterPortrait } from "../visuals/FantasyVisuals";
import { getAvatarOption } from "./avatarOptions";

type ProfileHeroVariant = "full" | "compact";
type ProfileHeroContext = "home" | "progress" | "train" | "adventure";

interface ProfileHeroSectionProps {
  variant?: ProfileHeroVariant;
  context?: ProfileHeroContext;
}

interface ProfileHeroState {
  progress: UserProgress;
  workouts: Workout[];
  summaries: DailyActivitySummary[];
  achievements: Achievement[];
  skills: HeroSkill[];
  hero?: HeroProgress | undefined;
  regions: AdventureRegion[];
  activeMob?: AdventureMob | undefined;
}

const emptyProgress: UserProgress = {
  id: "user",
  totalXP: 0,
  level: 1,
  updatedAt: ""
};

export function ProfileHeroSection({
  variant = "full",
  context = "progress"
}: ProfileHeroSectionProps) {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const settings = useSettingsStore((state) => state.settings);
  const [state, setState] = useState<ProfileHeroState>({
    progress: emptyProgress,
    workouts: [],
    summaries: [],
    achievements: [],
    skills: [],
    regions: []
  });
  const [selectedSkill, setSelectedSkill] = useState<HeroSkill | undefined>();

  const load = useCallback(async () => {
    const [progress, workouts, summaries, achievements, adventure] = await Promise.all([
      getUserProgress(),
      listWorkouts(),
      listSummaries(),
      listAchievements(),
      listAdventureState()
    ]);
    const activeMob = adventure.mobs.find((mob) => mob.id === adventure.activeTarget?.mobId);
    setState({
      progress,
      workouts,
      summaries,
      achievements,
      hero: adventure.hero,
      skills: adventure.skills,
      regions: adventure.regions,
      activeMob
    });
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener("fit-quest-adventure-updated", load);
    return () => window.removeEventListener("fit-quest-adventure-updated", load);
  }, [load]);

  const appLanguage = settings?.appLanguage ?? "en";
  const t = (key: string) => translate(appLanguage, key);
  const ta = (key: string) => translateAdventure(settings, key);
  const displayName = settings?.displayName?.trim() || t("common.player");
  const avatar = getAvatarOption(settings?.avatarId ?? "default");
  const levelProgress = getCurrentLevelProgress(state.progress.totalXP);
  const streak = calculateStreaks(state.workouts.map((workout) => workout.localDate));
  const currentRegion = state.regions.find((region) => region.id === state.hero?.selectedRealmId);
  const regionLabel = translateRealmTitle(currentRegion?.title, ta);
  const latestAchievement = state.achievements.find((achievement) => achievement.unlockedAt);
  const skillPoints = state.hero?.unspentSkillPoints ?? 0;
  const hpNow = state.hero?.currentHP ?? 100;
  const hpMax = state.hero?.maxHP ?? 100;
  const hpPercent = hpMax <= 0 ? 0 : Math.min(100, (hpNow / hpMax) * 100);
  const isCompact = variant === "compact" || settings?.viewMode === "basic";
  const totalLabel = useMemo(() => {
    const distance = state.summaries.reduce(
      (total, summary) => total + (summary.totalDistanceMeters ?? 0),
      0
    );
    const seconds = state.summaries.reduce(
      (total, summary) => total + (summary.totalSeconds ?? 0),
      0
    );
    const reps = state.summaries.reduce((total, summary) => total + (summary.totalReps ?? 0), 0);
    if (distance > 0) {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    if (seconds > 0) {
      return `${Math.floor(seconds / 60)}m`;
    }
    return String(reps);
  }, [state.summaries]);

  return (
    <section
      className={cn(
        "app-card overflow-hidden rounded-[2rem] p-5 lg:p-6",
        context === "home" && "accent-selected"
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[auto_minmax(20rem,1fr)_minmax(17rem,0.75fr)] lg:items-center">
        <div className="flex items-center gap-4">
          <div
            aria-label={`${displayName} ${t("profile.avatar")}`}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full shadow-[var(--accent-glow)] lg:h-24 lg:w-24"
            role="img"
          >
            <CharacterPortrait characterId={avatar.id} size={variant === "compact" ? "md" : "lg"} />
          </div>
          <div className="min-w-0">
            <p className="text-app-muted text-sm font-bold uppercase tracking-[0.16em]">
              {context === "home" ? t("profile.heroSummary") : t("profile.profileHero")}
            </p>
            <h2 className="text-app mt-1 text-3xl font-black leading-tight lg:text-4xl">
              {displayName}
            </h2>
            <p className="text-app-soft mt-1 text-sm">
              {t("profile.level")} {levelProgress.level} · {t("profile.hp")} {hpNow}/{hpMax}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <HeroProgressLine
            label={`${t("profile.level")} ${levelProgress.level}`}
            percent={levelProgress.percent}
            value={`${levelProgress.xpIntoLevel}/${levelProgress.xpForNextLevel} XP`}
          />
          <HeroProgressLine
            label={t("profile.hp")}
            percent={hpPercent}
            tone="success"
            value={`${hpNow}/${hpMax}`}
          />
          {!isCompact && latestAchievement ? (
            <p className="text-app-soft text-sm">
              {t("profile.latestBadge")}:{" "}
              <span className="font-bold text-[var(--success)]">{latestAchievement.title}</span>
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <HeroChip
            label={t("profile.activeRealm")}
            onClick={() => setActiveTab("adventure")}
            value={regionLabel}
          />
          <HeroChip
            label={t("profile.activeFight")}
            onClick={() => setActiveTab("adventure")}
            value={translateMobTitle(state.activeMob, settings)}
          />
          <HeroChip
            label={t("profile.skillPoints")}
            onClick={() => setActiveTab("train")}
            pulse={skillPoints > 0}
            value={String(skillPoints)}
          />
          {(["power", "endurance", "focus", "agility"] as const).map((slug) => {
            const skill = state.skills.find((item) => item.slug === slug);
            return (
              <HeroChip
                key={slug}
                label={translateSkillName(slug, t)}
                onClick={() => {
                  if (skill) {
                    setSelectedSkill(skill);
                  }
                }}
                value={String(skill?.level ?? 1)}
              />
            );
          })}
          {!isCompact ? (
            <>
              <HeroChip label={t("profile.currentStreak")} value={`${streak.current}d`} />
              <HeroChip label={t("profile.bestStreak")} value={`${streak.best}d`} />
              <HeroChip label={t("profile.workoutCount")} value={String(state.workouts.length)} />
              <HeroChip label={t("profile.total")} value={totalLabel} />
              <HeroChip
                label={t("profile.bosses")}
                value={String(state.hero?.defeatedBossCount ?? 0)}
              />
            </>
          ) : null}
        </div>
      </div>
      {selectedSkill ? (
        <HeroSkillModal onClose={() => setSelectedSkill(undefined)} skill={selectedSkill} t={t} />
      ) : null}
    </section>
  );
}

function HeroProgressLine({
  label,
  value,
  percent,
  tone = "accent"
}: {
  label: string;
  value: string;
  percent: number;
  tone?: "accent" | "success";
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-app-muted text-xs font-bold uppercase tracking-[0.16em]">{label}</p>
        <p className="text-app text-sm font-black">{value}</p>
      </div>
      <div className="app-progress mt-2 h-3 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "success" ? "bg-[var(--success)]" : "bg-[var(--accent)]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function HeroChip({
  label,
  value,
  pulse = false,
  onClick
}: {
  label: string;
  value: string;
  pulse?: boolean;
  onClick?: (() => void) | undefined;
}) {
  const content = (
    <div className="flex items-start gap-2">
      {pulse ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" /> : null}
      <div className="min-w-0">
        <p className="text-app-muted text-[0.62rem] font-bold uppercase tracking-[0.12em]">
          {label}
        </p>
        <p className="text-app mt-1 break-words text-sm font-black leading-tight">{value}</p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        className="app-inset focus-ring rounded-2xl p-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--hover-soft)]"
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return <div className="app-inset rounded-2xl p-3">{content}</div>;
}

function translateRealmTitle(title: string | undefined, ta: (key: string) => string) {
  if (!title) {
    return ta("realms.gate");
  }
  const keys: Record<string, string> = {
    "Gate of First Reps": "realms.gate",
    "Forest of Form": "realms.forest",
    "Caves of Consistency": "realms.caves",
    "Iron Ridge": "realms.iron",
    "Plateau of Discipline": "realms.plateau",
    "The Plateau of Discipline": "realms.plateau",
    "Stormroad Expanse": "realms.stormroad",
    "Citadel of the Repbound": "realms.citadel"
  };
  return ta(keys[title] ?? "realms.gate");
}

function translateMobTitle(mob: AdventureMob | undefined, settings: Settings | undefined) {
  if (!mob) {
    return "-";
  }
  return getAdventureLanguage(settings) === "el" ? mob.titleEl : mob.title;
}

function HeroSkillModal({
  skill,
  onClose,
  t
}: {
  skill: HeroSkill;
  onClose: () => void;
  t: (key: string) => string;
}) {
  return (
    <div
      aria-labelledby="hero-skill-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-4 backdrop-blur-sm"
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
      <div className="app-card max-w-sm rounded-[2rem] p-5">
        <p className="text-app-muted text-xs font-black uppercase tracking-[0.14em]">
          {t("profile.heroStats")}
        </p>
        <h2 className="text-app mt-1 text-2xl font-black" id="hero-skill-title">
          {translateSkillName(skill.slug, t)} {skill.level}
        </h2>
        <p className="text-app-soft mt-2 text-sm leading-6">
          {translateSkillDetail(skill.slug, t)}
        </p>
        <button
          className="focus-ring mt-5 min-h-11 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)]"
          onClick={onClose}
          type="button"
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}

function translateSkillName(slug: HeroSkillSlug, t: (key: string) => string) {
  const keys: Record<HeroSkillSlug, string> = {
    power: "adventure.skillPower",
    endurance: "adventure.skillEndurance",
    focus: "adventure.skillFocus",
    agility: "adventure.skillAgility",
    luck: "adventure.skillLuck",
    life: "adventure.skillLife"
  };
  return t(keys[slug]);
}

function translateSkillDetail(slug: HeroSkillSlug, t: (key: string) => string) {
  const keys: Record<HeroSkillSlug, string> = {
    power: "profile.skillPowerDetail",
    endurance: "profile.skillEnduranceDetail",
    focus: "profile.skillFocusDetail",
    agility: "profile.skillAgilityDetail",
    luck: "profile.skillLuckDetail",
    life: "profile.skillLifeDetail"
  };
  return t(keys[slug]);
}
