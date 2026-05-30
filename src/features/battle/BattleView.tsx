import { Activity, Dumbbell, Footprints, Heart, RotateCcw, Timer, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BattleBackdrop,
  BossIcon,
  CharacterPortrait,
  MonsterIcon
} from "../../components/visuals/FantasyVisuals";
import type { EnemyVisual } from "../../data/assetMap";
import { mapBossState, mapMobState, resolveEnemyVisual } from "../../data/assetMap";
import { listActivities } from "../../db/repositories/activitiesRepo";
import {
  fleeAdventureBattle,
  listAdventureState,
  resolveAdventureHit,
  restAdventureHero
} from "../../db/repositories/adventureRepo";
import { createCardioWorkout, createCompletedWorkout } from "../../db/repositories/workoutsRepo";
import type {
  Activity as ActivityModel,
  ActivityType,
  AdventureBoss,
  AdventureHitMetric,
  AdventureHitRequirement,
  AdventureMob,
  HeroProgress,
  HeroSkill,
  HeroSkillSlug,
  Settings
} from "../../db/schema";
import { useAppStore } from "../../stores/appStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../utils/classNames";
import { formatDuration, toLocalDate } from "../../utils/dates";
import { getAdventureLanguage, translate, translateAdventure } from "../../utils/i18n";
import { createId } from "../../utils/ids";

type EnemyRecord = { kind: "mob"; enemy: AdventureMob } | { kind: "boss"; enemy: AdventureBoss };

interface BattleModalState {
  title: string;
  body: string | string[];
  tone: "victory" | "defeat" | "rest" | "flee" | "info";
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
}

const metricIcon: Record<AdventureHitMetric, typeof Dumbbell> = {
  reps: Dumbbell,
  seconds: Timer,
  distanceMeters: Footprints
};

export function BattleView({ enemyId }: { enemyId: string }) {
  const setActiveBattle = useAppStore((state) => state.setActiveBattle);
  const settings = useSettingsStore((state) => state.settings);
  const [hero, setHero] = useState<HeroProgress | undefined>();
  const [skills, setSkills] = useState<HeroSkill[]>([]);
  const [activities, setActivities] = useState<ActivityModel[]>([]);
  const [enemyRecord, setEnemyRecord] = useState<EnemyRecord | undefined>();
  const [hit, setHit] = useState<AdventureHitRequirement | undefined>();
  const [inputOpen, setInputOpen] = useState(false);
  const [repValue, setRepValue] = useState(0);
  const [distanceKm, setDistanceKm] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState<number | undefined>();
  const [log, setLog] = useState<string[]>([]);
  const [floatText, setFloatText] = useState<string | undefined>();
  const [heroFloatText, setHeroFloatText] = useState<string | undefined>();
  const [modal, setModal] = useState<BattleModalState | undefined>();
  const [isResolving, setIsResolving] = useState(false);
  const [hitAnimation, setHitAnimation] = useState(false);
  const [enemyTurnAnimation, setEnemyTurnAnimation] = useState(false);

  const load = useCallback(async () => {
    const [adventure, nextActivities] = await Promise.all([listAdventureState(), listActivities()]);
    const mob = adventure.mobs.find((item) => item.id === enemyId);
    const boss = adventure.bosses.find((item) => item.id === enemyId);
    setHero(adventure.hero);
    setSkills(adventure.skills);
    setActivities(nextActivities);
    setEnemyRecord(
      mob ? { kind: "mob", enemy: mob } : boss ? { kind: "boss", enemy: boss } : undefined
    );
    setHit(adventure.hitRequirements.find((item) => item.enemyId === enemyId));
  }, [enemyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (log.length === 0) {
      setLog([translateAdventure(settings, "battle.started")]);
    }
  }, [log.length, settings]);

  useEffect(() => {
    if (timerStartedAt === undefined) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - timerStartedAt) / 1000));
    }, 250);
    return () => window.clearInterval(interval);
  }, [timerStartedAt]);

  const enemy = enemyRecord?.enemy;
  const t = (key: string) => translate(settings?.appLanguage ?? "en", key);
  const ta = (key: string) => translateAdventure(settings, key);
  const activity = useMemo(() => getActivityForHit(hit, activities), [activities, hit]);
  const loggedValue = useMemo(() => {
    if (!hit) {
      return 0;
    }
    if (hit.metric === "seconds") {
      return elapsedSeconds;
    }
    if (hit.metric === "distanceMeters") {
      return Math.max(0, Math.round((Number(distanceKm) || 0) * 1000));
    }
    return repValue;
  }, [distanceKm, elapsedSeconds, hit, repValue]);
  const canAttack = Boolean(hit && activity && loggedValue >= hit.requiredValue && !isResolving);
  const damagePreview =
    hit && enemy
      ? calculateExpectedDamage({
          hit,
          loggedValue: Math.max(loggedValue, hit.requiredValue),
          weakness: enemy.weakness,
          skills
        })
      : undefined;
  const Icon = hit ? metricIcon[hit.metric] : Dumbbell;

  if (!enemy || !hit) {
    return (
      <section className="app-card rounded-[2rem] p-6 text-center">
        <p className="text-app text-xl font-black">{ta("battle.notFound")}</p>
        <button
          className="focus-ring mt-4 rounded-2xl bg-[var(--accent)] px-4 py-3 font-black text-[var(--accent-contrast)]"
          onClick={() => setActiveBattle(undefined)}
          type="button"
        >
          {ta("adventure.backToRealm")}
        </button>
      </section>
    );
  }

  const enemyTypeLabel =
    enemyRecord.kind === "boss"
      ? "Boss"
      : enemyRecord.enemy.enemyType === "elite"
        ? "Elite"
        : "Enemy";
  const enemyVisual = resolveEnemyVisual(
    enemy,
    translateHitLabel(hit, settings),
    enemyRecord.kind === "boss"
      ? "boss"
      : enemyRecord.enemy.enemyType === "elite"
        ? "elite"
        : "normal"
  );
  const enemyVisualState =
    enemyRecord.kind === "boss"
      ? mapBossState(enemyRecord.enemy.status, true)
      : mapMobState(enemyRecord.enemy.status, true);
  const enemyHpPercent =
    enemy.maxHP <= 0 ? 0 : Math.min(100, (enemy.currentHP / enemy.maxHP) * 100);
  const heroHpPercent =
    hero && hero.maxHP > 0 ? Math.min(100, (hero.currentHP / hero.maxHP) * 100) : 0;

  const resetInput = () => {
    setRepValue(0);
    setDistanceKm("");
    setElapsedSeconds(0);
    setTimerStartedAt(undefined);
    setInputOpen(false);
  };

  const saveWorkoutForHit = async () => {
    if (!activity) {
      throw new Error("Activity for hit not found.");
    }
    const endedAt = new Date().toISOString();
    const durationSeconds = hit.metric === "seconds" ? loggedValue : 0;
    const startedAt = new Date(Date.now() - durationSeconds * 1000).toISOString();
    const localDate = toLocalDate(endedAt);
    if (hit.metric === "distanceMeters") {
      await createCardioWorkout(
        {
          activityId: activity.id,
          startedAt,
          endedAt,
          localDate,
          distanceMeters: loggedValue,
          durationSeconds: Math.max(0, elapsedSeconds)
        },
        undefined,
        { source: "adventure" }
      );
      return;
    }
    await createCompletedWorkout(
      {
        activityId: activity.id,
        startedAt,
        endedAt,
        localDate,
        mode: hit.metric === "seconds" ? "timed" : "setEntry",
        sets: [
          {
            id: createId(),
            activityId: activity.id,
            setIndex: 1,
            value: loggedValue,
            startedAt,
            endedAt,
            localDate,
            ...(hit.metric === "seconds"
              ? { durationSeconds: loggedValue }
              : { durationSeconds: 0 })
          }
        ]
      },
      undefined,
      { source: "adventure" }
    );
  };

  const attack = async () => {
    if (!canAttack) {
      setLog((items) =>
        [`${ta("validation.notEnough")}: ${translateHitLabel(hit, settings)}.`, ...items].slice(
          0,
          5
        )
      );
      return;
    }
    setIsResolving(true);
    try {
      await saveWorkoutForHit();
      const result = await resolveAdventureHit({
        enemyId,
        metric: hit.metric,
        loggedValue
      });
      const localizedResult = { ...result, enemyTitle: translateEnemyTitle(enemy, settings) };
      setHitAnimation(true);
      setFloatText(`-${localizedResult.finalDamage}`);
      window.setTimeout(() => {
        setFloatText(undefined);
        setHitAnimation(false);
      }, 900);
      setLog((items) =>
        [localizeBattleLog(result.log[0], localizedResult, settings), ...items].slice(0, 5)
      );
      await new Promise((resolve) =>
        window.setTimeout(resolve, localizedResult.victory ? 500 : 1500)
      );
      if (!localizedResult.victory && localizedResult.enemyDamage > 0) {
        setEnemyTurnAnimation(true);
        setHeroFloatText(`-${localizedResult.enemyDamage} HP`);
        window.setTimeout(() => {
          setHeroFloatText(undefined);
          setEnemyTurnAnimation(false);
        }, 900);
      }
      setLog((items) =>
        [
          ...result.log.slice(1).map((item) => localizeBattleLog(item, localizedResult, settings)),
          ...items
        ].slice(0, 5)
      );
      await load();
      resetInput();
      if (localizedResult.victory) {
        window.dispatchEvent(new Event("fit-quest-adventure-updated"));
        setModal({
          title:
            getAdventureLanguage(settings) === "el"
              ? `${localizedResult.enemyTitle} νικήθηκε`
              : `${localizedResult.enemyTitle} defeated`,
          body: [
            `${t("adventure.damageConversion")}: ${localizedResult.finalDamage}`,
            `${t("battle.heroHp")}: ${localizedResult.heroHP}/${localizedResult.heroMaxHP}`,
            `${t("common.reward")}: +${localizedResult.rewardXP} XP`,
            `${t("profile.skillPoints")}: +${localizedResult.rewardSkillPoints}`
          ],
          tone: "victory",
          primaryLabel: ta("adventure.backToRealm"),
          onPrimary: () => {
            setModal(undefined);
            setActiveBattle(undefined);
          }
        });
      } else if (localizedResult.defeat) {
        setModal({
          title: ta("battle.defeatTitle"),
          body: `${localizedResult.enemyTitle}: ${ta("battle.defeatBody")}`,
          tone: "defeat",
          primaryLabel: ta("adventure.backToRealm"),
          onPrimary: () => {
            setModal(undefined);
            setActiveBattle(undefined);
          }
        });
      }
    } finally {
      setIsResolving(false);
    }
  };

  const rest = async () => {
    const result = await restAdventureHero();
    setHero(result.hero);
    setLog((items) => [`${ta("battle.rest")}: +${result.heal} HP.`, ...items].slice(0, 5));
    setModal({
      title: ta("battle.rest"),
      body: `${ta("battle.recovered")} ${result.heal} HP.`,
      tone: "rest",
      primaryLabel: ta("adventure.continueFight"),
      onPrimary: () => setModal(undefined)
    });
  };

  const flee = () => {
    setModal({
      title: ta("battle.fleeConfirmTitle"),
      body: ta("battle.fleeConfirmBody"),
      tone: "flee",
      primaryLabel: ta("battle.flee"),
      secondaryLabel: t("common.cancel"),
      onPrimary: async () => {
        await fleeAdventureBattle();
        setModal(undefined);
        setActiveBattle(undefined);
      }
    });
  };

  return (
    <section className="space-y-4">
      <button
        className="focus-ring inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black text-app-soft hover:bg-[var(--hover-soft)]"
        onClick={() => setActiveBattle(undefined)}
        type="button"
      >
        <X aria-hidden="true" size={16} />
        {ta("adventure.backToRealm")}
      </button>

      <section className="app-card overflow-hidden rounded-[2rem]">
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-app-muted text-xs font-black uppercase tracking-[0.16em]">
                {translateEnemyType(enemyTypeLabel, ta)} · {t("profile.level")} {enemy.level}
              </p>
              <h2 className="text-app mt-1 text-2xl font-black leading-tight md:text-3xl">
                {translateEnemyTitle(enemy, settings)}
              </h2>
            </div>
            <EnemyBadge type={enemyTypeLabel} visual={enemyVisual} />
          </div>
          <HealthBar
            label={ta("battle.enemyHp")}
            percent={enemyHpPercent}
            value={enemy.currentHP}
            max={enemy.maxHP}
            tone="enemy"
          />
        </div>

        <div className="battle-arena relative min-h-[19rem] overflow-hidden p-5">
          <BattleBackdrop realmId={enemyVisual.realmId} />
          {floatText ? (
            <div className="battle-damage-float pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 rounded-full bg-[var(--danger)] px-4 py-2 text-2xl font-black text-white shadow-lg">
              {floatText}
            </div>
          ) : null}
          {heroFloatText ? (
            <div className="battle-damage-float pointer-events-none absolute left-1/4 top-24 -translate-x-1/2 rounded-full bg-[var(--danger)] px-4 py-2 text-xl font-black text-white shadow-lg">
              {heroFloatText}
            </div>
          ) : null}
          <div className="relative z-10 grid min-h-[15rem] grid-cols-2 items-end gap-4">
            <div className="text-center">
              <div
                className={cn(
                  "battle-combatant mx-auto flex items-center justify-center",
                  enemyTurnAnimation && "battle-hero-hit"
                )}
              >
                <CharacterPortrait
                  animated
                  characterId={settings?.avatarId ?? "default"}
                  size="xl"
                />
              </div>
              <p className="text-app mt-3 font-black">
                {settings?.displayName?.trim() || t("common.player")}
              </p>
              <p className="text-app-muted text-xs font-bold">
                {t("profile.level")} {getHeroLevel(skills, hero)}
              </p>
            </div>
            <div className="text-center">
              <div
                className={cn(
                  "battle-combatant mx-auto flex items-center justify-center",
                  hitAnimation && "battle-enemy-hit"
                )}
              >
                {enemyRecord.kind === "boss" ? (
                  <BossIcon animated visual={enemyVisual} state={enemyVisualState} size="xl" />
                ) : (
                  <MonsterIcon animated visual={enemyVisual} state={enemyVisualState} size="xl" />
                )}
              </div>
              <p className="text-app mt-3 font-black">{translateEnemyTitle(enemy, settings)}</p>
              <p className="text-app-muted text-xs font-bold">
                {ta("battle.attack")} {enemy.attackPower}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <HealthBar
              label={ta("battle.yourHp")}
              percent={heroHpPercent}
              value={hero?.currentHP ?? 0}
              max={hero?.maxHP ?? 100}
              tone="hero"
            />
            <div className="rounded-[1.5rem] bg-[var(--surface-inset)] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)]">
                  <Icon aria-hidden="true" size={22} />
                </span>
                <div>
                  <p className="text-app-muted text-xs font-black uppercase tracking-[0.14em]">
                    {ta("battle.requiredHit")}
                  </p>
                  <h3 className="text-app mt-1 text-xl font-black">
                    {translateHitLabel(hit, settings)}
                  </h3>
                  <p className="text-app-soft mt-1 text-sm">
                    {t("common.preview")}: {damagePreview?.finalDamage ?? 0} {ta("battle.damage")} ·{" "}
                    {damagePreview?.baseDamage ?? 0} XP {ta("battle.beforeBonuses")}
                  </p>
                  {damagePreview && damagePreview.skillBonusPercent > 0 ? (
                    <p className="text-app-soft mt-1 text-xs">
                      {ta("battle.baseDamage")} {damagePreview.baseDamage} ·{" "}
                      {damagePreview.skillName} +{damagePreview.skillBonusPercent}%
                      {damagePreview.weaknessBonus ? " · weakness +15%" : ""}
                    </p>
                  ) : null}
                </div>
              </div>

              {!inputOpen ? (
                <button
                  className="focus-ring mt-4 min-h-12 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
                  onClick={() => setInputOpen(true)}
                  type="button"
                >
                  {ta("battle.doHit")}
                </button>
              ) : (
                <BattleInput
                  distanceKm={distanceKm}
                  displayLabel={translateHitLabel(hit, settings)}
                  elapsedSeconds={elapsedSeconds}
                  hit={hit}
                  labels={{
                    distanceCompleted: t("workout.distanceKm"),
                    pause: t("common.pause"),
                    repsCompleted: t("workout.completedReps"),
                    start: t("common.start"),
                    undo: t("common.undo")
                  }}
                  onAttack={() => void attack()}
                  onDistanceChange={setDistanceKm}
                  onRepChange={setRepValue}
                  onStartTimer={() => setTimerStartedAt(Date.now() - elapsedSeconds * 1000)}
                  onStopTimer={() => setTimerStartedAt(undefined)}
                  repValue={repValue}
                  timerRunning={timerStartedAt !== undefined}
                  valid={canAttack}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="focus-ring min-h-12 rounded-2xl bg-[var(--surface-inset)] px-3 text-sm font-black text-app hover:bg-[var(--hover-soft)]"
                onClick={() => void rest()}
                type="button"
              >
                {ta("battle.rest")}
              </button>
              <button
                className="focus-ring min-h-12 rounded-2xl bg-[var(--danger)] px-3 text-sm font-black text-white"
                onClick={flee}
                type="button"
              >
                {ta("battle.flee")}
              </button>
            </div>
          </div>

          <aside className="rounded-[1.5rem] bg-[var(--surface-inset)] p-4">
            <h3 className="text-app flex items-center gap-2 font-black">
              <Activity aria-hidden="true" size={18} />
              {ta("battle.combatLog")}
            </h3>
            <div className="mt-3 space-y-2">
              {log.slice(0, 5).map((item) => (
                <p
                  className="text-app-soft rounded-xl bg-[var(--surface)] px-3 py-2 text-sm"
                  key={item}
                >
                  {item}
                </p>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {modal ? <BattleModal modal={modal} onClose={() => setModal(undefined)} /> : null}
    </section>
  );
}

function BattleInput({
  hit,
  displayLabel,
  repValue,
  elapsedSeconds,
  distanceKm,
  timerRunning,
  valid,
  onRepChange,
  onDistanceChange,
  onStartTimer,
  onStopTimer,
  onAttack,
  labels
}: {
  hit: AdventureHitRequirement;
  displayLabel: string;
  repValue: number;
  elapsedSeconds: number;
  distanceKm: string;
  timerRunning: boolean;
  valid: boolean;
  onRepChange: (value: number) => void;
  onDistanceChange: (value: string) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onAttack: () => void;
  labels: {
    repsCompleted: string;
    undo: string;
    start: string;
    pause: string;
    distanceCompleted: string;
  };
}) {
  const current =
    hit.metric === "seconds"
      ? elapsedSeconds
      : hit.metric === "distanceMeters"
        ? Math.max(0, Math.round((Number(distanceKm) || 0) * 1000))
        : repValue;
  const percent = Math.min(100, (current / hit.requiredValue) * 100);
  return (
    <div className="mt-4 space-y-4">
      <button
        aria-label="Hit progress"
        className="focus-ring mx-auto grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(var(--accent)_var(--progress),var(--surface)_0)] p-2 transition active:scale-95 disabled:opacity-70"
        disabled={hit.metric !== "reps" && !valid}
        onClick={() => {
          if (hit.metric === "reps" && !valid) {
            onRepChange(repValue + 1);
            return;
          }
          if (valid) {
            onAttack();
          }
        }}
        type="button"
        style={{ "--progress": `${percent}%` } as CSSProperties}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-[var(--surface-inset)] text-center">
          <span>
            <span className="block text-2xl font-black text-app">
              {hit.metric === "seconds"
                ? formatDuration(current)
                : hit.metric === "distanceMeters"
                  ? `${(current / 1000).toFixed(2)} km`
                  : current}
            </span>
            <span className="text-app-muted text-xs font-bold">{displayLabel}</span>
          </span>
        </div>
      </button>

      {hit.metric === "reps" ? (
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
          <label className="block">
            <span className="text-app-soft mb-2 block text-sm font-bold">
              {labels.repsCompleted}
            </span>
            <input
              className="focus-ring min-h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 text-app outline-none"
              inputMode="numeric"
              min="0"
              onChange={(event) => onRepChange(Math.max(0, Number(event.target.value) || 0))}
              type="number"
              value={repValue}
            />
          </label>
          <button
            className="focus-ring self-end rounded-2xl bg-[var(--surface)] font-black text-app-soft"
            onClick={() => onRepChange(Math.max(0, repValue - 1))}
            type="button"
          >
            {labels.undo}
          </button>
        </div>
      ) : null}

      {hit.metric === "seconds" ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="focus-ring min-h-12 rounded-2xl bg-[var(--accent)] font-black text-[var(--accent-contrast)]"
            onClick={timerRunning ? onStopTimer : onStartTimer}
            type="button"
          >
            {timerRunning ? labels.pause : labels.start}
          </button>
          <button
            className="focus-ring min-h-12 rounded-2xl bg-[var(--surface)] font-black text-app-soft"
            onClick={() => onStopTimer()}
            type="button"
          >
            {labels.pause}
          </button>
        </div>
      ) : null}

      {hit.metric === "distanceMeters" ? (
        <label className="block">
          <span className="text-app-soft mb-2 block text-sm font-bold">
            {labels.distanceCompleted}
          </span>
          <input
            className="focus-ring min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-app outline-none"
            inputMode="decimal"
            min="0"
            onChange={(event) => onDistanceChange(event.target.value)}
            placeholder="0.50"
            type="number"
            value={distanceKm}
          />
        </label>
      ) : null}
    </div>
  );
}

function localizeBattleLog(
  item: string | undefined,
  result: {
    enemyTitle: string;
    finalDamage: number;
    enemyDamage: number;
    critical: boolean;
    dodged: boolean;
    victory: boolean;
    defeat: boolean;
  },
  settings: Settings | undefined
) {
  if (!item) {
    return "";
  }
  if (getAdventureLanguage(settings) !== "el") {
    return item;
  }
  if (item.startsWith("You hit")) {
    return `Χτύπησες ${result.enemyTitle} για ${result.finalDamage} ζημιά.`;
  }
  if (item === "Critical hit!") {
    return "Κρίσιμο χτύπημα!";
  }
  if (item.includes("defeated")) {
    return `${result.enemyTitle} νικήθηκε.`;
  }
  if (item.includes("hit you")) {
    return `${result.enemyTitle} σε χτύπησε για ${result.enemyDamage} HP.`;
  }
  if (item === "Dodged!") {
    return "Απέφυγες το χτύπημα!";
  }
  if (item.startsWith("You fell")) {
    return "Έπεσες. Το βασίλειο παραμένει.";
  }
  return item;
}

function EnemyBadge({ type, visual }: { type: string; visual: EnemyVisual }) {
  const isBoss = type === "Boss";
  return (
    <span
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl",
        isBoss ? "bg-[var(--danger)] text-white" : "bg-[var(--surface-inset)] text-[var(--accent)]"
      )}
    >
      {isBoss ? (
        <BossIcon visual={visual} state="active" size="sm" />
      ) : (
        <MonsterIcon visual={visual} state="active" size="sm" />
      )}
    </span>
  );
}

function translateEnemyType(type: string, ta: (key: string) => string) {
  if (type === "Boss") {
    return ta("adventure.boss");
  }
  if (type === "Elite") {
    return ta("adventure.elite");
  }
  return ta("adventure.enemy");
}

function translateEnemyTitle(enemy: AdventureMob | AdventureBoss, settings: Settings | undefined) {
  return getAdventureLanguage(settings) === "el" ? enemy.titleEl : enemy.title;
}

function translateHitLabel(hit: AdventureHitRequirement, settings: Settings | undefined) {
  return getAdventureLanguage(settings) === "el" ? hit.displayLabelEl : hit.displayLabel;
}

function HealthBar({
  label,
  percent,
  value,
  max,
  tone
}: {
  label: string;
  percent: number;
  value: number;
  max: number;
  tone: "hero" | "enemy";
}) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm">
        <span className="text-app-soft font-bold">{label}</span>
        <span className="text-app-muted">
          {value} / {max}
        </span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--surface-inset)]">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "hero" ? "bg-[var(--success)]" : "bg-[var(--danger)]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function BattleModal({ modal, onClose }: { modal: BattleModalState; onClose: () => void }) {
  const Icon = modal.tone === "defeat" ? Heart : modal.tone === "flee" ? RotateCcw : Dumbbell;
  return (
    <div
      aria-labelledby="battle-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
      role="dialog"
    >
      <div className="app-card max-w-md rounded-[2rem] p-6 text-center">
        <span className="pulse-glow mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
          <Icon aria-hidden="true" size={30} />
        </span>
        <h2 className="text-app mt-4 text-2xl font-black" id="battle-modal-title">
          {modal.title}
        </h2>
        {Array.isArray(modal.body) ? (
          <ul className="text-app-soft mt-3 space-y-2 text-left text-sm leading-6">
            {modal.body.map((item) => (
              <li className="rounded-xl bg-[var(--surface-inset)] px-3 py-2" key={item}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-app-soft mt-3 text-sm leading-6">{modal.body}</p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {modal.tone === "flee" ? (
            <button
              className="focus-ring min-h-11 rounded-2xl bg-[var(--surface-inset)] px-4 font-black text-app-soft"
              onClick={onClose}
              type="button"
            >
              {modal.secondaryLabel ?? "Stay"}
            </button>
          ) : null}
          <button
            className={cn(
              "focus-ring min-h-11 rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]",
              modal.tone !== "flee" && "col-span-2"
            )}
            onClick={modal.onPrimary}
            type="button"
          >
            {modal.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function getActivityForHit(hit: AdventureHitRequirement | undefined, activities: ActivityModel[]) {
  if (!hit) {
    return undefined;
  }
  if (hit.activityId) {
    return activities.find((activity) => activity.id === hit.activityId);
  }
  if (hit.activitySlug) {
    return activities.find((activity) => activity.slug === hit.activitySlug);
  }
  if (hit.activityType) {
    return activities.find((activity) => activity.activityType === hit.activityType);
  }
  return activities[0];
}

function getBaseDamage(metric: AdventureHitMetric, value: number) {
  if (metric === "seconds") {
    return Math.max(0, Math.floor(value / 10));
  }
  if (metric === "distanceMeters") {
    return Math.max(0, Math.floor(value / 100));
  }
  return Math.max(0, value);
}

function calculateExpectedDamage({
  hit,
  loggedValue,
  weakness,
  skills
}: {
  hit: AdventureHitRequirement;
  loggedValue: number;
  weakness: ActivityType;
  skills: HeroSkill[];
}) {
  const activityType = inferHitActivityType(hit);
  const baseDamage = Math.max(1, getBaseDamage(hit.metric, loggedValue));
  const skillSlug = getSkillSlugForActivity(activityType);
  const skill = skills.find((item) => item.slug === skillSlug);
  const skillBonusPercent = Math.max(0, (skill?.level ?? 1) - 1) * 2;
  const weaknessBonus = activityType === weakness;
  const finalDamage = Math.max(
    1,
    Math.floor(baseDamage * (1 + skillBonusPercent / 100) * (weaknessBonus ? 1.15 : 1))
  );

  return {
    baseDamage,
    finalDamage,
    skillBonusPercent,
    skillName: skill?.name ?? skillSlug,
    weaknessBonus
  };
}

function inferHitActivityType(hit: AdventureHitRequirement): ActivityType {
  if (hit.activityType) {
    return hit.activityType;
  }
  if (hit.metric === "seconds") {
    return "timed";
  }
  if (hit.metric === "distanceMeters") {
    return "cardio";
  }
  return "strength";
}

function getSkillSlugForActivity(activityType: ActivityType): HeroSkillSlug {
  if (activityType === "timed") {
    return "focus";
  }
  if (activityType === "cardio") {
    return "agility";
  }
  return "power";
}

function getHeroLevel(skills: HeroSkill[], hero: HeroProgress | undefined) {
  void skills;
  if (!hero) {
    return 1;
  }
  return Math.max(1, Math.floor((hero.maxHP - 100) / 10) + 1);
}
