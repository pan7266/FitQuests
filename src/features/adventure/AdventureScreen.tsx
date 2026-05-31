import { ArrowLeft, Award, Check, Lock, Search, Swords } from "lucide-react";
import type { ReactNode, TouchEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileHeroSection } from "../../components/profile/ProfileHeroSection";
import { RecordCard } from "../../components/records/RecordCard";
import { BossIcon, MonsterIcon, RealmBanner } from "../../components/visuals/FantasyVisuals";
import type { EnemyVisual, VisualState } from "../../data/assetMap";
import {
  mapBossState,
  mapMobState,
  resolveChestVisual,
  resolveEnemyVisual,
  resolveRealmState
} from "../../data/assetMap";
import { listActivities } from "../../db/repositories/activitiesRepo";
import {
  listAdventureState,
  openAdventureChest,
  selectAdventureRealm,
  selectBossTarget,
  selectMobTarget
} from "../../db/repositories/adventureRepo";
import type {
  ActiveAdventureTarget,
  Activity,
  ActivityType,
  AdventureBoss,
  AdventureChest,
  AdventureEvent,
  AdventureHitMetric,
  AdventureHitRequirement,
  AdventureMob,
  AdventureMobRequirement,
  AdventureRegion,
  HeroProgress,
  HeroSkill,
  HeroSkillSlug,
  Settings
} from "../../db/schema";
import { useAppStore } from "../../stores/appStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../utils/classNames";
import { formatDuration } from "../../utils/dates";
import { translate, translateAdventure } from "../../utils/i18n";
import { BattleView } from "../battle/BattleView";

type RealmFilter =
  | "all"
  | "available"
  | "active"
  | "defeated"
  | "locked"
  | "enemies"
  | "elites"
  | "bosses"
  | "chests";
type RealmSort = "status" | "level" | "hp" | "reward" | "requirement";
type RealmNodeType = "enemy" | "elite" | "boss" | "chest";

interface RealmNode {
  id: string;
  type: RealmNodeType;
  title: string;
  titleEl?: string;
  description: string;
  descriptionEl?: string;
  status: "locked" | "available" | "active" | "defeated" | "opened";
  level: number;
  rewardXP: number;
  rewardSkillPoints: number;
  requirementLabel: string;
  hpCurrent: number;
  hpMax: number;
  mob?: AdventureMob | undefined;
  boss?: AdventureBoss | undefined;
  chest?: AdventureChest | undefined;
  requirement?: AdventureMobRequirement | undefined;
  hitRequirement?: AdventureHitRequirement | undefined;
}

const filters: Array<{ id: RealmFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "active", label: "Active" },
  { id: "defeated", label: "Defeated" },
  { id: "locked", label: "Locked" },
  { id: "enemies", label: "Enemies" },
  { id: "elites", label: "Elites" },
  { id: "bosses", label: "Bosses" },
  { id: "chests", label: "Chests" }
];

const REALM_ORDER = [
  "region_gate",
  "region_forest",
  "region_caves",
  "region_iron",
  "region_plateau",
  "region_storm"
];

export function AdventureScreen() {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const activeBattle = useAppStore((state) => state.activeBattle);
  const setActiveBattle = useAppStore((state) => state.setActiveBattle);
  const settings = useSettingsStore((state) => state.settings);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hero, setHero] = useState<HeroProgress | undefined>();
  const [skills, setSkills] = useState<HeroSkill[]>([]);
  const [regions, setRegions] = useState<AdventureRegion[]>([]);
  const [bosses, setBosses] = useState<AdventureBoss[]>([]);
  const [chests, setChests] = useState<AdventureChest[]>([]);
  const [mobs, setMobs] = useState<AdventureMob[]>([]);
  const [requirements, setRequirements] = useState<AdventureMobRequirement[]>([]);
  const [hitRequirements, setHitRequirements] = useState<AdventureHitRequirement[]>([]);
  const [activeTarget, setActiveTarget] = useState<ActiveAdventureTarget | undefined>();
  const [events, setEvents] = useState<AdventureEvent[]>([]);
  const [realmId, setRealmId] = useState<string | undefined>();
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [filter, setFilter] = useState<RealmFilter>("all");
  const [sort, setSort] = useState<RealmSort>("level");
  const [search, setSearch] = useState("");
  const [collapsedHowTo, setCollapsedHowTo] = useState(false);
  const [chestReward, setChestReward] = useState<string | undefined>();
  const [preFightNode, setPreFightNode] = useState<RealmNode | undefined>();
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | undefined>();

  const load = useCallback(async () => {
    const [nextActivities, adventure] = await Promise.all([
      listActivities({ includeArchived: true }),
      listAdventureState()
    ]);
    setActivities(nextActivities);
    setHero(adventure.hero);
    setSkills(adventure.skills);
    setRegions(adventure.regions);
    setBosses(adventure.bosses);
    setChests(adventure.chests);
    setMobs(adventure.mobs);
    setRequirements(adventure.mobRequirements);
    setHitRequirements(adventure.hitRequirements);
    setActiveTarget(adventure.activeTarget);
    setEvents(adventure.events);
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener("fit-quest-adventure-updated", load);
    return () => window.removeEventListener("fit-quest-adventure-updated", load);
  }, [load]);

  const selectedRealmId = realmId ?? hero?.selectedRealmId ?? "region_gate";
  const t = (key: string) => translate(settings?.appLanguage ?? "en", key);
  const ta = (key: string) => translateAdventure(settings, key);
  const orderedRegions = [...regions].sort(
    (left, right) => REALM_ORDER.indexOf(left.id) - REALM_ORDER.indexOf(right.id)
  );
  const selectedRealm = orderedRegions.find((region) => region.id === selectedRealmId);
  const activeMob = mobs.find((mob) => mob.id === activeTarget?.mobId);
  const activeRequirement = activeMob
    ? requirements.find((requirement) => requirement.mobId === activeMob.id)
    : undefined;
  const activeFightActivity = getActivityForRequirement(activeRequirement, activities);
  const anyWorkoutLabel = t("adventure.anyWorkout");
  const realmNodes = useMemo(
    () =>
      selectedRealm
        ? buildRealmNodes({
            realm: selectedRealm,
            mobs,
            bosses,
            chests,
            requirements,
            hitRequirements,
            activeTarget,
            activities,
            fallbackRequirementLabel: anyWorkoutLabel
          })
        : [],
    [
      activeTarget,
      activities,
      anyWorkoutLabel,
      bosses,
      chests,
      hitRequirements,
      mobs,
      requirements,
      selectedRealm
    ]
  );
  const selectedNode = realmNodes.find((node) => node.id === selectedNodeId);
  const filteredNodes = realmNodes
    .filter((node) => filterNode(node, filter))
    .filter((node) => node.title.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => sortNodes(left, right, sort));

  const enterRealm = async (region: AdventureRegion) => {
    if (!region.isUnlocked) {
      return;
    }
    await selectAdventureRealm(region.id);
    setRealmId(region.id);
    setSelectedNodeId(undefined);
    await load();
  };

  const beginFightForNode = async (node: RealmNode) => {
    if (node.mob) {
      await selectMobTarget(node.mob.id);
      setActiveBattle({ enemyId: node.mob.id });
    } else if (node.boss) {
      await selectBossTarget(node.boss.id);
      setActiveBattle({ enemyId: node.boss.id });
    } else {
      return;
    }
    window.dispatchEvent(new Event("fit-quest-adventure-updated"));
    setActiveTab("adventure");
    await load();
  };

  const startFightForNode = (node: RealmNode) => {
    if (node.status === "active") {
      void beginFightForNode(node);
      return;
    }
    setPreFightNode(node);
  };

  const openChest = async (node: RealmNode) => {
    if (!node.chest) {
      return;
    }
    await openAdventureChest(node.chest.id);
    setChestReward(`+${node.chest.rewardXP} ${t("adventure.chestRewardFound")}`);
    await load();
  };

  if (!selectedRealm) {
    return null;
  }

  if (activeBattle) {
    return <BattleView enemyId={activeBattle.enemyId} />;
  }

  const showRealmDetail = realmId !== undefined;
  const handleSwipeBackEnd = (event: TouchEvent<HTMLElement>) => {
    if (!showRealmDetail || !swipeStart) {
      return;
    }
    const touch = event.changedTouches.item(0);
    if (!touch) {
      return;
    }
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = Math.abs(touch.clientY - swipeStart.y);
    if (swipeStart.x < 36 && deltaX > 90 && deltaY < 70) {
      setRealmId(undefined);
    }
    setSwipeStart(undefined);
  };

  return (
    <section
      className="space-y-4 lg:space-y-6"
      onTouchEnd={handleSwipeBackEnd}
      onTouchStart={(event) => {
        const touch = event.changedTouches.item(0);
        if (touch) {
          setSwipeStart({ x: touch.clientX, y: touch.clientY });
        }
      }}
    >
      {!showRealmDetail ? null : (
        <button
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-inset)] px-4 text-sm font-black text-app hover:bg-[var(--hover-soft)]"
          onClick={() => setRealmId(undefined)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          {t("adventure.backToRealms")}
        </button>
      )}

      {!showRealmDetail ? (
        <>
          <header>
            <h1 className="text-app text-3xl font-black">{t("common.adventure")}</h1>
          </header>
          <ProfileHeroSection context="adventure" variant="full" />
          <ActiveFightCard
            activity={activeFightActivity}
            hero={hero}
            mob={activeMob}
            onContinue={() =>
              activeMob
                ? void startFightForNode({
                    id: activeMob.id,
                    type: "enemy",
                    title: activeMob.title,
                    description: activeMob.description,
                    status: "active",
                    level: 1,
                    rewardXP: activeMob.rewardXP,
                    rewardSkillPoints: activeMob.rewardSkillPoints,
                    requirementLabel: activeRequirement
                      ? formatRequirement(activeRequirement, activeFightActivity)
                      : "",
                    hpCurrent: activeRequirement
                      ? activeRequirement.requiredValue - activeRequirement.currentValue
                      : 0,
                    hpMax: activeRequirement?.requiredValue ?? 0,
                    mob: activeMob,
                    requirement: activeRequirement,
                    hitRequirement: hitRequirements.find((hit) => hit.enemyId === activeMob.id)
                  })
                : undefined
            }
            requirement={activeRequirement}
            t={t}
          />
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {orderedRegions.map((region) => (
              <RealmCard
                bosses={bosses}
                chests={chests}
                key={region.id}
                mobs={mobs}
                onEnter={() => void enterRealm(region)}
                region={region}
                ta={ta}
                t={t}
              />
            ))}
          </section>
          {!collapsedHowTo ? (
            <HowAdventureWorks onCollapse={() => setCollapsedHowTo(true)} t={t} />
          ) : null}
          <RecentEvents events={events.slice(0, 5)} t={t} />
        </>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section className="space-y-4">
            <RealmDetailHeader
              bosses={bosses}
              chests={chests}
              mobs={mobs}
              nodes={realmNodes}
              region={selectedRealm}
              ta={ta}
              t={t}
            />
            <RealmToolbar
              filter={filter}
              onFilter={setFilter}
              onSearch={setSearch}
              onSort={setSort}
              search={search}
              sort={sort}
              t={t}
            />
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {filteredNodes.map((node) => (
                <RealmNodeCard
                  key={node.id}
                  node={node}
                  onSelect={() => setSelectedNodeId(node.id)}
                  selected={selectedNode?.id === node.id}
                  settings={settings}
                  t={t}
                />
              ))}
            </div>
          </section>
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <NodeDetailPanel
              activity={getActivityForNode(selectedNode, activities)}
              hero={hero}
              node={selectedNode}
              onOpenChest={openChest}
              onStartFight={startFightForNode}
              settings={settings}
              skills={skills}
              t={t}
            />
          </aside>
        </div>
      )}

      {chestReward ? (
        <Modal title={t("adventure.chestOpened")} onClose={() => setChestReward(undefined)} t={t}>
          <p className="text-app-soft mt-2 text-sm leading-6">{chestReward}</p>
        </Modal>
      ) : null}
      {preFightNode ? (
        <PreFightModal
          activity={getActivityForNode(preFightNode, activities)}
          hero={hero}
          node={preFightNode}
          onClose={() => setPreFightNode(undefined)}
          onStart={() => {
            const nextNode = preFightNode;
            setPreFightNode(undefined);
            void beginFightForNode(nextNode);
          }}
          settings={settings}
          skills={skills}
          t={t}
        />
      ) : null}
    </section>
  );
}

function ActiveFightCard({
  mob,
  requirement,
  activity,
  hero,
  onContinue,
  t
}: {
  mob?: AdventureMob | undefined;
  requirement?: AdventureMobRequirement | undefined;
  activity?: Activity | undefined;
  hero?: HeroProgress | undefined;
  onContinue: () => void;
  t: (key: string) => string;
}) {
  if (!mob || !requirement) {
    return null;
  }
  const hp = Math.max(0, requirement.requiredValue - requirement.currentValue);
  return (
    <section className="app-card accent-selected rounded-[1.75rem] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-app-muted text-xs font-black uppercase tracking-[0.16em]">
            {t("profile.activeFight")}
          </p>
          <h2 className="text-app mt-1 text-2xl font-black">{mob.title}</h2>
          <p className="text-app-soft mt-1 text-sm">
            {t("battle.requiredHit")}: {formatRequirement(requirement, activity)} ·{" "}
            {t("battle.enemyAttack")}: -5 HP
          </p>
        </div>
        <button
          className="focus-ring min-h-11 rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
          onClick={onContinue}
          type="button"
        >
          {t("adventure.continueFight")}
        </button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <HealthLine
          label={t("battle.enemyHp")}
          value={hp}
          max={requirement.requiredValue}
          tone="enemy"
        />
        <HealthLine
          label={t("battle.heroHp")}
          value={hero?.currentHP ?? 100}
          max={hero?.maxHP ?? 100}
        />
      </div>
    </section>
  );
}

function RealmCard({
  region,
  mobs,
  bosses,
  chests,
  onEnter,
  t,
  ta
}: {
  region: AdventureRegion;
  mobs: AdventureMob[];
  bosses: AdventureBoss[];
  chests: AdventureChest[];
  onEnter: () => void;
  t: (key: string) => string;
  ta: (key: string) => string;
}) {
  const realmMobs = mobs.filter((mob) => mob.realmId === region.id);
  const defeated = realmMobs.filter((mob) => mob.status === "defeated").length;
  const elites = realmMobs.filter((mob) => mob.enemyType === "elite");
  const defeatedElites = elites.filter((mob) => mob.status === "defeated").length;
  const realmBosses = bosses.filter((item) => item.regionId === region.id);
  const defeatedBosses = realmBosses.filter((item) => item.status === "defeated").length;
  const realmChests = chests.filter((item) => item.realmId === region.id);
  const openedChests = realmChests.filter((item) => item.status === "opened").length;
  const realmState = resolveRealmState(region);
  return (
    <article
      className={cn(
        "app-card flex h-full flex-col overflow-hidden rounded-[1.75rem] p-4",
        region.status === "completed" && "border-[var(--success)]"
      )}
    >
      <RealmBanner
        className="mb-4"
        compact
        realmId={region.id}
        state={realmState}
        title={translateRealmTitle(region.title, ta)}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-h-[5.25rem]">
          <p className="text-app-muted text-xs font-black uppercase tracking-[0.14em]">
            {translateStatus(region.status, t)}
          </p>
          <h2 className="text-app mt-1 text-xl font-black leading-tight">
            {translateRealmTitle(region.title, ta)}
          </h2>
        </div>
        <StatusIcon state={realmState} />
      </div>
      <p className="text-app-soft mt-3 min-h-[4.5rem] text-sm leading-6">{region.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <FlatMetric label={t("common.progress")} value={`${region.progress}%`} />
        <FlatMetric label={t("adventure.enemies")} value={`${defeated}/${realmMobs.length}`} />
        <FlatMetric label={t("adventure.elites")} value={`${defeatedElites}/${elites.length}`} />
        <FlatMetric label={t("adventure.chests")} value={`${openedChests}/${realmChests.length}`} />
        <FlatMetric
          label={t("adventure.bosses")}
          value={`${defeatedBosses}/${realmBosses.length}`}
        />
      </div>
      <button
        className="focus-ring mt-auto min-h-11 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)] disabled:bg-[var(--toggle-off)] disabled:text-[var(--text-muted)] disabled:shadow-none"
        disabled={!region.isUnlocked}
        onClick={onEnter}
        type="button"
      >
        {region.status === "completed"
          ? t("common.completed")
          : region.isUnlocked
            ? t("adventure.enterRealm")
            : t("common.locked")}
      </button>
    </article>
  );
}

function HowAdventureWorks({
  onCollapse,
  t
}: {
  onCollapse: () => void;
  t: (key: string) => string;
}) {
  return (
    <section className="app-card rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-app text-xl font-black">{t("adventure.howItWorks")}</h2>
          <ol className="text-app-soft mt-3 grid gap-2 text-sm leading-6 md:grid-cols-5">
            <li>1. {t("adventure.howStep1")}</li>
            <li>2. {t("adventure.howStep2")}</li>
            <li>3. {t("adventure.howStep3")}</li>
            <li>4. {t("adventure.howStep4")}</li>
            <li>5. {t("adventure.howStep5")}</li>
          </ol>
        </div>
        <button
          className="focus-ring rounded-xl px-3 py-2 text-sm font-black text-app-soft hover:bg-[var(--hover-soft)]"
          onClick={onCollapse}
          type="button"
        >
          {t("adventure.collapse")}
        </button>
      </div>
    </section>
  );
}

function RealmDetailHeader({
  region,
  nodes,
  mobs,
  bosses,
  chests,
  t,
  ta
}: {
  region: AdventureRegion;
  nodes: RealmNode[];
  mobs: AdventureMob[];
  bosses: AdventureBoss[];
  chests: AdventureChest[];
  t: (key: string) => string;
  ta: (key: string) => string;
}) {
  const defeatedEnemies = nodes.filter(
    (node) => (node.type === "enemy" || node.type === "elite") && node.status === "defeated"
  ).length;
  const realmChests = chests.filter((item) => item.realmId === region.id);
  const openedChests = realmChests.filter((item) => item.status === "opened").length;
  const realmBosses = bosses.filter((item) => item.regionId === region.id);
  const defeatedBosses = realmBosses.filter((item) => item.status === "defeated").length;
  const realmMobs = mobs.filter((mob) => mob.realmId === region.id);
  return (
    <section className="app-card overflow-hidden rounded-[1.75rem] p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
        <div>
          <p className="text-app-muted text-xs font-black uppercase tracking-[0.16em]">
            {t("adventure.realmDetail")}
          </p>
          <h2 className="text-app mt-1 text-3xl font-black">
            {translateRealmTitle(region.title, ta)}
          </h2>
          <p className="text-app-soft mt-2 text-sm leading-6">{region.description}</p>
        </div>
        <RealmBanner
          compact
          realmId={region.id}
          state={resolveRealmState(region)}
          title={translateRealmTitle(region.title, ta)}
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <FlatMetric label={t("common.goal")} value={t("adventure.realmGoal")} />
        <FlatMetric label={t("common.progress")} value={`${region.progress}%`} />
        <FlatMetric
          label={t("adventure.defeatedMobs")}
          value={`${defeatedEnemies}/${realmMobs.length}`}
        />
        <FlatMetric label={t("adventure.chests")} value={`${openedChests}/${realmChests.length}`} />
        <FlatMetric
          label={t("adventure.bosses")}
          value={`${defeatedBosses}/${realmBosses.length}`}
        />
      </div>
    </section>
  );
}

function RealmToolbar({
  filter,
  sort,
  search,
  onFilter,
  onSort,
  onSearch,
  t
}: {
  filter: RealmFilter;
  sort: RealmSort;
  search: string;
  onFilter: (filter: RealmFilter) => void;
  onSort: (sort: RealmSort) => void;
  onSearch: (search: string) => void;
  t: (key: string) => string;
}) {
  return (
    <section className="app-card rounded-[1.75rem] p-4">
      <label className="block">
        <span className="text-app-soft mb-2 block text-sm font-bold">
          {t("adventure.searchRealm")}
        </span>
        <span className="app-inset flex items-center gap-2 rounded-2xl px-3">
          <Search aria-hidden="true" className="text-app-muted" size={18} />
          <input
            className="min-h-11 flex-1 bg-transparent text-app outline-none"
            onChange={(event) => onSearch(event.target.value)}
            placeholder={t("adventure.searchPlaceholder")}
            value={search}
          />
        </span>
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            className={cn(
              "focus-ring min-h-10 rounded-xl px-3 text-sm font-black",
              filter === item.id
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "bg-[var(--surface-inset)] text-app-soft hover:bg-[var(--hover-soft)]"
            )}
            key={item.id}
            onClick={() => onFilter(item.id)}
            type="button"
          >
            {translateFilterLabel(item.id, t)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["status", "level", "hp", "reward", "requirement"] as const).map((item) => (
          <button
            className={cn(
              "focus-ring min-h-9 rounded-xl px-3 text-xs font-black capitalize",
              sort === item
                ? "border border-[var(--accent)] text-[var(--accent)]"
                : "text-app-muted hover:bg-[var(--hover-soft)]"
            )}
            key={item}
            onClick={() => onSort(item)}
            type="button"
          >
            {translateSortLabel(item, t)}
          </button>
        ))}
      </div>
    </section>
  );
}

function RealmNodeCard({
  node,
  selected,
  onSelect,
  settings,
  t
}: {
  node: RealmNode;
  selected: boolean;
  onSelect: () => void;
  settings?: Settings | undefined;
  t: (key: string) => string;
}) {
  const visual = getNodeVisual(node);
  const visualState = getNodeVisualState(node);
  return (
    <button
      className={cn(
        "focus-ring app-card rounded-[1.5rem] p-4 text-left transition",
        selected && "accent-selected"
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-xs font-black uppercase tracking-[0.14em]", getStatusColor(node))}>
            {translateStatus(node.status, t)}
          </p>
          <h3 className="text-app mt-1 text-lg font-black leading-tight">
            {translateNodeTitle(node, settings)}
          </h3>
        </div>
        {node.type === "boss" ? (
          <BossIcon visual={visual} state={visualState} size="md" />
        ) : (
          <MonsterIcon visual={visual} state={visualState} size="md" />
        )}
      </div>
      <p className="text-app-soft mt-2 text-sm leading-6">{node.requirementLabel}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <FlatMetric label={t("profile.level")} value={String(node.level)} />
        <FlatMetric label={t("adventure.reward")} value={`+${node.rewardXP} XP`} />
      </div>
      {node.type !== "chest" ? (
        <HealthLine label={t("profile.hp")} value={node.hpCurrent} max={node.hpMax} tone="enemy" />
      ) : null}
    </button>
  );
}

function NodeDetailPanel({
  node,
  activity,
  hero,
  onStartFight,
  onOpenChest,
  skills,
  settings,
  t
}: {
  node?: RealmNode | undefined;
  activity?: Activity | undefined;
  hero?: HeroProgress | undefined;
  onStartFight: (node: RealmNode) => void;
  onOpenChest: (node: RealmNode) => void | Promise<void>;
  skills: HeroSkill[];
  settings?: Settings | undefined;
  t: (key: string) => string;
}) {
  if (!node) {
    return null;
  }
  const canFight =
    (node.type === "enemy" || node.type === "elite" || node.type === "boss") &&
    (node.status === "available" || node.status === "active");
  const canOpenChest = node.type === "chest" && node.status === "available";
  const damagePreview =
    node.hitRequirement && node.type !== "chest"
      ? calculateExpectedDamage({
          hit: node.hitRequirement,
          loggedValue: node.hitRequirement.requiredValue,
          weakness: node.mob?.weakness ?? node.boss?.weakness ?? "strength",
          skills
        })
      : undefined;
  const visual = getNodeVisual(node);
  const visualState = getNodeVisualState(node);
  return (
    <section className="app-card rounded-[1.5rem] p-4">
      <div className="flex items-start gap-3">
        {node.type === "boss" ? (
          <BossIcon visual={visual} state={visualState} size="md" />
        ) : (
          <MonsterIcon visual={visual} state={visualState} size="md" />
        )}
        <div>
          <p className={cn("text-xs font-black uppercase tracking-[0.14em]", getStatusColor(node))}>
            {translateNodeType(node.type, t)} · {translateStatus(node.status, t)}
          </p>
          <h2 className="text-app mt-1 text-xl font-black">{translateNodeTitle(node, settings)}</h2>
          <p className="text-app-soft mt-1 text-xs leading-5">
            {translateNodeDescription(node, settings)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <section className="rounded-2xl border border-[color-mix(in_srgb,var(--success)_32%,var(--border-soft))] bg-[color-mix(in_srgb,var(--success)_8%,var(--surface-inset))] p-3">
          <h3 className="text-app mb-2 text-sm font-black">{t("profile.heroSummary")}</h3>
          <div className="grid gap-2">
            <RecordCard
              label={t("battle.heroHp")}
              value={`${hero?.currentHP ?? 100}/${hero?.maxHP ?? 100}`}
            />
            <RecordCard label={t("profile.level")} value={String(getHeroLevel(hero))} />
            <RecordCard
              label={t("profile.skillPoints")}
              value={String(hero?.unspentSkillPoints ?? 0)}
            />
          </div>
        </section>
        <section className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_34%,var(--border-soft))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface-inset))] p-3">
          <h3 className="text-app mb-2 text-sm font-black">
            {node.type === "chest" ? t("adventure.chest") : t("adventure.enemy")}
          </h3>
          <div className="grid gap-2">
            <RecordCard label={t("profile.level")} value={String(node.level)} />
            <RecordCard label={t("adventure.reward")} value={`+${node.rewardXP} XP`} />
            <RecordCard label={t("profile.skillPoints")} value={String(node.rewardSkillPoints)} />
          </div>
        </section>
      </div>
      {node.type === "chest" ? (
        <div className="mt-4 rounded-2xl bg-[var(--surface-inset)] p-4">
          <p className="text-app font-bold">{t("adventure.unlocked")}</p>
          <p className="text-app-soft mt-1 text-sm">{node.requirementLabel}</p>
        </div>
      ) : (
        <>
          <HealthLine
            label={t("battle.enemyHp")}
            value={node.hpCurrent}
            max={node.hpMax}
            tone="enemy"
          />
          <div className="mt-4 rounded-2xl bg-[var(--surface-inset)] p-4">
            <p className="text-app font-bold">{t("adventure.damageConversion")}</p>
            <p className="text-app-soft mt-1 text-sm">
              {activity?.activityType === "timed"
                ? "10 seconds = 1 damage"
                : activity?.activityType === "cardio"
                  ? "100 meters = 1 damage"
                  : "1 rep = 1 damage"}
            </p>
            <p className="text-app-soft mt-1 text-sm">
              {t("battle.requiredHit")}: {node.requirementLabel}
            </p>
            {damagePreview ? (
              <p className="text-app-soft mt-1 text-sm">
                {t("adventure.expectedDamage")}:{" "}
                <span className="font-black text-[var(--accent)]">{damagePreview.finalDamage}</span>{" "}
                ({t("battle.baseDamage")} {damagePreview.baseDamage}
                {damagePreview.skillBonusPercent > 0
                  ? `, ${damagePreview.skillName} +${damagePreview.skillBonusPercent}%`
                  : ""}
                {damagePreview.weaknessBonus ? `, ${t("adventure.weakness")} +15%` : ""})
              </p>
            ) : null}
            <p className="text-app-soft mt-1 text-sm">{t("adventure.enemyCounterattack")}: -5 HP</p>
          </div>
        </>
      )}
      <button
        className="focus-ring mt-5 min-h-12 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)] disabled:bg-[var(--toggle-off)] disabled:text-[var(--text-muted)] disabled:shadow-none"
        disabled={!canFight && !canOpenChest}
        onClick={() => (node.type === "chest" ? onOpenChest(node) : onStartFight(node))}
        type="button"
      >
        {node.status === "active"
          ? t("adventure.continueFight")
          : node.type === "chest"
            ? node.status === "opened"
              ? t("common.open")
              : node.status === "locked"
                ? t("common.locked")
                : t("adventure.openChest")
            : node.status === "defeated"
              ? t("common.defeated")
              : node.status === "locked"
                ? t("common.locked")
                : t("adventure.startFight")}
      </button>
    </section>
  );
}

function PreFightModal({
  node,
  activity,
  hero,
  skills,
  onStart,
  onClose,
  settings,
  t
}: {
  node: RealmNode;
  activity?: Activity | undefined;
  hero?: HeroProgress | undefined;
  skills: HeroSkill[];
  onStart: () => void;
  onClose: () => void;
  settings?: Settings | undefined;
  t: (key: string) => string;
}) {
  const expectedDamage = node.hitRequirement
    ? calculateExpectedDamage({
        hit: node.hitRequirement,
        loggedValue: node.hitRequirement.requiredValue,
        weakness: node.mob?.weakness ?? node.boss?.weakness ?? "strength",
        skills
      })
    : undefined;
  const visual = getNodeVisual(node);
  const visualState = getNodeVisualState(node);

  return (
    <div
      aria-labelledby="pre-fight-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-5 backdrop-blur-sm"
      role="dialog"
    >
      <div className="app-card max-w-lg rounded-[2rem] p-6">
        <div className="flex items-start gap-4">
          {node.type === "boss" ? (
            <BossIcon visual={visual} state={visualState} size="lg" />
          ) : (
            <MonsterIcon visual={visual} state={visualState} size="lg" />
          )}
          <div>
            <p
              className={cn("text-xs font-black uppercase tracking-[0.14em]", getStatusColor(node))}
            >
              {t("battle.preFight")} · {t("profile.level")} {node.level}
            </p>
            <h2 className="text-app mt-1 text-2xl font-black" id="pre-fight-title">
              {translateNodeTitle(node, settings)}
            </h2>
            <p className="text-app-soft mt-2 text-sm leading-6">
              {translateNodeDescription(node, settings)}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <FlatMetric label={t("battle.enemyHp")} value={`${node.hpCurrent}/${node.hpMax}`} />
          <FlatMetric
            label={t("battle.enemyAttack")}
            value={`${node.mob?.attackPower ?? node.boss?.attackPower ?? 5} HP`}
          />
          <FlatMetric
            label={t("adventure.weakness")}
            value={node.mob?.weakness ?? node.boss?.weakness ?? "strength"}
          />
          <FlatMetric
            label={t("battle.heroHp")}
            value={`${hero?.currentHP ?? 100}/${hero?.maxHP ?? 100}`}
          />
          <FlatMetric label={t("profile.level")} value={String(getHeroLevel(hero))} />
          <FlatMetric label={t("battle.exercise")} value={activity?.name ?? t("common.workout")} />
          <FlatMetric label={t("battle.requiredHit")} value={node.requirementLabel} />
          <FlatMetric
            label={t("adventure.expectedDamage")}
            value={expectedDamage ? String(expectedDamage.finalDamage) : t("adventure.unknown")}
          />
          <FlatMetric label={t("adventure.reward")} value={`+${node.rewardXP} XP`} />
          <FlatMetric label={t("profile.skillPoints")} value={String(node.rewardSkillPoints)} />
        </div>
        {expectedDamage ? (
          <p className="text-app-soft mt-4 text-sm">
            {t("battle.baseDamage")} {expectedDamage.baseDamage}
            {expectedDamage.skillBonusPercent > 0
              ? ` · ${expectedDamage.skillName} +${expectedDamage.skillBonusPercent}%`
              : ""}
            {expectedDamage.weaknessBonus ? ` · ${t("adventure.weakness")} +15%` : ""}.
          </p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="focus-ring min-h-11 rounded-2xl bg-[var(--surface-inset)] px-4 font-black text-app-soft"
            onClick={onClose}
            type="button"
          >
            {t("adventure.notYet")}
          </button>
          <button
            className="focus-ring min-h-11 rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
            onClick={onStart}
            type="button"
          >
            {t("adventure.startFight")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecentEvents({ events, t }: { events: AdventureEvent[]; t: (key: string) => string }) {
  return (
    <section className="app-card rounded-[1.75rem] p-5">
      <h2 className="text-app text-xl font-black">{t("adventure.recentEvents")}</h2>
      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <p className="text-app-soft text-sm">{t("adventure.noEvents")}</p>
        ) : (
          events.map((event) => (
            <div className="border-l-2 border-[var(--accent)] py-1 pl-3" key={event.id}>
              <p className="text-app font-bold">{event.title}</p>
              <p className="text-app-muted mt-1 text-sm">{event.description}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Modal({
  title,
  children,
  onClose,
  t
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  t?: ((key: string) => string) | undefined;
}) {
  return (
    <div
      aria-labelledby="adventure-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-5 backdrop-blur-sm"
      role="dialog"
    >
      <div className="app-card max-w-sm rounded-[2rem] p-6 text-center">
        <span className="pulse-glow mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
          <Award aria-hidden="true" size={30} />
        </span>
        <h2 className="text-app mt-4 text-2xl font-black" id="adventure-modal-title">
          {title}
        </h2>
        {children}
        <button
          className="focus-ring mt-5 min-h-11 w-full rounded-2xl bg-[var(--accent)] px-4 font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
          onClick={onClose}
          type="button"
        >
          {t ? t("adventure.continue") : "Continue"}
        </button>
      </div>
    </div>
  );
}

function HealthLine({
  label,
  value,
  max,
  tone = "hero"
}: {
  label: string;
  value: number;
  max: number;
  tone?: "hero" | "enemy";
}) {
  const percent = max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-sm">
        <span className="text-app-soft font-bold">{label}</span>
        <span className="text-app-muted">
          {value} / {max}
        </span>
      </div>
      <div className="app-progress mt-2 h-3 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "enemy" ? "bg-[var(--danger)]" : "bg-[var(--success)]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatusIcon({ state }: { state: VisualState }) {
  const className =
    state === "locked"
      ? "text-app-muted"
      : state === "defeated" || state === "opened" || state === "completed"
        ? "text-[var(--success)]"
        : "text-[var(--accent)]";
  const Icon =
    state === "locked"
      ? Lock
      : state === "defeated" || state === "opened" || state === "completed"
        ? Check
        : Swords;
  return <Icon aria-hidden="true" className={className} size={22} />;
}

function FlatMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-inset)] p-3">
      <p className="text-app-muted text-[0.62rem] font-black uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="text-app mt-1 text-sm font-black leading-tight">{value}</p>
    </div>
  );
}

function buildRealmNodes(params: {
  realm: AdventureRegion;
  mobs: AdventureMob[];
  bosses: AdventureBoss[];
  chests: AdventureChest[];
  requirements: AdventureMobRequirement[];
  hitRequirements: AdventureHitRequirement[];
  activeTarget?: ActiveAdventureTarget | undefined;
  activities: Activity[];
  fallbackRequirementLabel: string;
}): RealmNode[] {
  const enemyNodes = params.mobs
    .filter((mob) => mob.realmId === params.realm.id)
    .map((mob): RealmNode => {
      const requirement = params.requirements.find((item) => item.mobId === mob.id);
      const hitRequirement = params.hitRequirements.find((item) => item.enemyId === mob.id);
      const activity = getActivityForRequirement(requirement, params.activities);
      const status =
        params.activeTarget?.mobId === mob.id && mob.status !== "defeated" ? "active" : mob.status;
      return {
        id: mob.id,
        type: mob.enemyType === "elite" ? "elite" : "enemy",
        title: mob.title,
        titleEl: mob.titleEl,
        description: mob.description,
        descriptionEl: mob.descriptionEl,
        status: status === "selected" ? "active" : status,
        level: mob.level,
        rewardXP: mob.rewardXP,
        rewardSkillPoints: mob.rewardSkillPoints,
        requirementLabel:
          hitRequirement?.displayLabel ??
          (requirement
            ? formatRequirement(requirement, activity)
            : params.fallbackRequirementLabel),
        hpCurrent: mob.currentHP,
        hpMax: mob.maxHP,
        mob,
        requirement,
        hitRequirement
      };
    });
  const chestNodes = params.chests
    .filter((chest) => chest.realmId === params.realm.id)
    .map(
      (chest, index): RealmNode => ({
        id: chest.id,
        type: "chest",
        title: chest.title,
        titleEl: chest.titleEl,
        description: chest.description,
        descriptionEl: chest.descriptionEl,
        status: chest.status,
        level: index + 1,
        rewardXP: chest.rewardXP,
        rewardSkillPoints: chest.rewardSkillPoints,
        requirementLabel: chest.unlockRequirement,
        hpCurrent: 0,
        hpMax: 0,
        chest
      })
    );
  const bossNodes = params.bosses
    .filter((boss) => boss.regionId === params.realm.id)
    .map(
      (boss): RealmNode => ({
        id: boss.id,
        type: "boss",
        title: boss.title,
        titleEl: boss.titleEl,
        description: boss.description,
        descriptionEl: boss.descriptionEl,
        status:
          params.activeTarget?.bossId === boss.id && boss.status !== "defeated"
            ? "active"
            : boss.status === "unlocked"
              ? "available"
              : boss.status,
        level: boss.level,
        rewardXP: boss.rewardXP,
        rewardSkillPoints: boss.rewardSkillPoints,
        requirementLabel:
          params.hitRequirements.find((item) => item.enemyId === boss.id)?.displayLabel ??
          boss.defeatRequirement,
        hpCurrent: boss.currentHP,
        hpMax: boss.maxHP,
        boss,
        hitRequirement: params.hitRequirements.find((item) => item.enemyId === boss.id)
      })
    );
  return [...enemyNodes, ...chestNodes, ...bossNodes];
}

function filterNode(node: RealmNode, filter: RealmFilter) {
  if (filter === "all") {
    return true;
  }
  if (filter === "enemies") {
    return node.type === "enemy";
  }
  if (filter === "elites") {
    return node.type === "elite";
  }
  if (filter === "bosses") {
    return node.type === "boss";
  }
  if (filter === "chests") {
    return node.type === "chest";
  }
  return node.status === filter;
}

function sortNodes(left: RealmNode, right: RealmNode, sort: RealmSort) {
  if (sort === "level") {
    return left.level - right.level;
  }
  if (sort === "hp") {
    return right.hpCurrent - left.hpCurrent;
  }
  if (sort === "reward") {
    return right.rewardXP - left.rewardXP;
  }
  if (sort === "requirement") {
    return left.requirementLabel.localeCompare(right.requirementLabel);
  }
  return left.status.localeCompare(right.status);
}

function getActivityForRequirement(
  requirement: AdventureMobRequirement | undefined,
  activities: Activity[]
) {
  if (!requirement) {
    return undefined;
  }
  if (requirement.activityId) {
    return activities.find((activity) => activity.id === requirement.activityId);
  }
  if (requirement.activitySlug) {
    return activities.find((activity) => activity.slug === requirement.activitySlug);
  }
  if (requirement.activityType) {
    return activities.find((activity) => activity.activityType === requirement.activityType);
  }
  return activities[0];
}

function getActivityForHit(hit: AdventureHitRequirement | undefined, activities: Activity[]) {
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

function getActivityForNode(node: RealmNode | undefined, activities: Activity[]) {
  return (
    getActivityForHit(node?.hitRequirement, activities) ??
    getActivityForRequirement(node?.requirement, activities)
  );
}

function formatRequirement(requirement: AdventureMobRequirement, activity: Activity | undefined) {
  if (requirement.metric === "distanceMeters") {
    return `${(requirement.requiredValue / 1000).toFixed(2)} km ${activity?.name ?? ""}`.trim();
  }
  if (requirement.metric === "seconds") {
    return `${formatDuration(requirement.requiredValue)} ${activity?.name ?? ""}`.trim();
  }
  if (requirement.metric === "workouts") {
    return `${requirement.requiredValue} workouts`;
  }
  if (requirement.metric === "streak") {
    return `${requirement.requiredValue} day streak`;
  }
  return `${requirement.requiredValue} ${activity?.name ?? "reps"}`;
}

function getNodeVisual(node: RealmNode): EnemyVisual {
  if (node.chest) {
    return resolveChestVisual(node.chest);
  }
  if (node.boss) {
    return resolveEnemyVisual(node.boss, node.requirementLabel, "boss");
  }
  if (node.mob) {
    return resolveEnemyVisual(
      node.mob,
      node.requirementLabel,
      node.type === "elite" ? "elite" : "normal"
    );
  }
  return {
    id: node.id,
    realmId: "region_gate",
    name: node.title,
    type: "normal",
    level: node.level,
    hp: node.hpCurrent,
    attack: 0,
    weakness: "strength",
    requiredExercise: node.requirementLabel,
    rewardXp: node.rewardXP,
    iconKey: "gate-slime",
    portraitKey: "gate-slime-portrait",
    battleImageKey: "gate-slime-battle",
    silhouetteType: "beast",
    visualTheme: "training-gate",
    themeColor: "var(--accent)"
  };
}

function getNodeVisualState(node: RealmNode): VisualState {
  if (node.mob) {
    return mapMobState(node.mob.status, node.status === "active");
  }
  if (node.boss) {
    return mapBossState(node.boss.status, node.status === "active");
  }
  if (node.chest) {
    return node.chest.status;
  }
  return node.status;
}

function getTypeColor(type: RealmNodeType) {
  if (type === "chest") {
    return "text-[var(--warning)]";
  }
  if (type === "boss" || type === "elite") {
    return "text-[var(--danger)]";
  }
  return "text-[var(--accent)]";
}

function getStatusColor(node: RealmNode) {
  if (node.status === "defeated" || node.status === "opened") {
    return "text-[var(--success)]";
  }
  if (node.status === "locked") {
    return "text-app-muted";
  }
  if (node.status === "active") {
    return "text-[var(--accent)]";
  }
  return getTypeColor(node.type);
}

function translateStatus(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    locked: "common.locked",
    unlocked: "common.unlocked",
    available: "common.available",
    active: "common.active",
    selected: "common.active",
    defeated: "common.defeated",
    completed: "common.completed",
    opened: "common.open"
  };
  return t(keys[status] ?? "common.available");
}

function translateNodeType(type: RealmNodeType, t: (key: string) => string) {
  if (type === "boss") {
    return t("adventure.boss");
  }
  if (type === "elite") {
    return t("adventure.elite");
  }
  if (type === "chest") {
    return t("adventure.chest");
  }
  return t("adventure.enemy");
}

function translateFilterLabel(filter: RealmFilter, t: (key: string) => string) {
  const keys: Record<RealmFilter, string> = {
    all: "stats.allActivities",
    available: "common.available",
    active: "common.active",
    defeated: "common.defeated",
    locked: "common.locked",
    enemies: "adventure.enemies",
    elites: "adventure.elites",
    bosses: "adventure.bosses",
    chests: "adventure.chests"
  };
  return t(keys[filter]);
}

function translateSortLabel(sort: RealmSort, t: (key: string) => string) {
  const keys: Record<RealmSort, string> = {
    status: "adventure.sortStatus",
    level: "adventure.sortLevel",
    hp: "adventure.sortHp",
    reward: "adventure.sortReward",
    requirement: "adventure.sortRequirement"
  };
  return t(keys[sort]);
}

function translateNodeTitle(node: RealmNode, settings: Settings | undefined) {
  const language =
    settings?.adventureLanguage === "same" ? settings.appLanguage : settings?.adventureLanguage;
  return language === "el" ? (node.titleEl ?? node.title) : node.title;
}

function translateNodeDescription(node: RealmNode, settings: Settings | undefined) {
  const language =
    settings?.adventureLanguage === "same" ? settings.appLanguage : settings?.adventureLanguage;
  return language === "el" ? (node.descriptionEl ?? node.description) : node.description;
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
  const skillName = getSkillNameForActivity(activityType);
  const skillLevel = getSkillLevel(skills, skillName.toLowerCase() as HeroSkillSlug);
  const skillBonusPercent = Math.max(0, skillLevel - 1) * 2;
  const skillMultiplier = 1 + skillBonusPercent / 100;
  const weaknessBonus = activityType === weakness;
  const weaknessMultiplier = weaknessBonus ? 1.15 : 1;
  const finalDamage = Math.max(1, Math.floor(baseDamage * skillMultiplier * weaknessMultiplier));

  return {
    baseDamage,
    finalDamage,
    skillBonusPercent,
    skillName,
    weaknessBonus
  };
}

function getBaseDamage(metric: AdventureHitMetric, value: number) {
  if (metric === "seconds") {
    return Math.floor(value / 10);
  }
  if (metric === "distanceMeters") {
    return Math.floor(value / 100);
  }
  return value;
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

function getSkillNameForActivity(activityType: ActivityType) {
  if (activityType === "timed") {
    return "Focus";
  }
  if (activityType === "cardio") {
    return "Agility";
  }
  return "Power";
}

function getSkillLevel(skills: HeroSkill[], slug: HeroSkillSlug) {
  return skills.find((skill) => skill.slug === slug)?.level ?? 1;
}

function getHeroLevel(hero: HeroProgress | undefined) {
  if (!hero) {
    return 1;
  }
  return Math.max(1, Math.floor((hero.maxHP - 100) / 10) + 1);
}
