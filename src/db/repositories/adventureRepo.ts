import { buildAdventureContent } from "../../utils/adventureContent";
import { createId } from "../../utils/ids";
import { getLevelFromXP } from "../../utils/levels";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type {
  ActiveAdventureTarget,
  ActivityType,
  AdventureBoss,
  AdventureChest,
  AdventureEvent,
  AdventureHitMetric,
  AdventureHitRequirement,
  AdventureMob,
  AdventureProgress,
  AdventureRegion,
  BossStatus,
  ChestStatus,
  HeroProgress,
  HeroSkill,
  HeroSkillSlug,
  MobStatus,
  RealmStatus
} from "../schema";
import { getActiveProfileId } from "./profilesRepo";

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const ADVENTURE_CONTENT = buildAdventureContent();

export const HERO_SKILL_DEFINITIONS: Array<Omit<HeroSkill, "level" | "updatedAt">> = [
  {
    id: "skill_power",
    slug: "power",
    name: "Power",
    description: "Strength damage.",
    icon: "Sword"
  },
  {
    id: "skill_endurance",
    slug: "endurance",
    name: "Endurance",
    description: "Maximum HP, damage reduction, and better rest recovery.",
    icon: "Boots"
  },
  {
    id: "skill_focus",
    slug: "focus",
    name: "Focus",
    description: "Timed exercise damage and goal discipline.",
    icon: "Shield"
  },
  {
    id: "skill_agility",
    slug: "agility",
    name: "Agility",
    description: "Cardio damage and dodge chance.",
    icon: "Wind"
  },
  {
    id: "skill_luck",
    slug: "luck",
    name: "Luck",
    description: "Critical hits and reward quality.",
    icon: "Sparkles"
  },
  {
    id: "skill_life",
    slug: "life",
    name: "Life",
    description: "Survival margin and recovery.",
    icon: "Heart"
  }
];

export interface AdventureBattleResult {
  enemyId: string;
  enemyTitle: string;
  enemyType: "enemy" | "elite" | "boss";
  baseDamage: number;
  finalDamage: number;
  enemyDamage: number;
  critical: boolean;
  dodged: boolean;
  victory: boolean;
  defeat: boolean;
  enemyHP: number;
  enemyMaxHP: number;
  heroHP: number;
  heroMaxHP: number;
  rewardXP: number;
  rewardSkillPoints: number;
  log: string[];
}

export interface AdventureHitInput {
  enemyId: string;
  metric: AdventureHitMetric;
  loggedValue: number;
}

const generatedIds = {
  regions: new Set(ADVENTURE_CONTENT.regions.map((item) => item.id)),
  mobs: new Set(ADVENTURE_CONTENT.mobs.map((item) => item.id)),
  bosses: new Set(ADVENTURE_CONTENT.bosses.map((item) => item.id)),
  chests: new Set(ADVENTURE_CONTENT.chests.map((item) => item.id)),
  requirements: new Set(ADVENTURE_CONTENT.requirements.map((item) => item.id)),
  hitRequirements: new Set(ADVENTURE_CONTENT.hitRequirements.map((item) => item.id))
};

const createEvent = (
  type: AdventureEvent["type"],
  title: string,
  description: string,
  timestamp: string,
  profileId?: string
): AdventureEvent => ({
  id: createId(),
  ...(profileId ? { profileId } : {}),
  type,
  title,
  description,
  localDate: today(),
  createdAt: timestamp
});

const getRegionStatus = (unlocked: boolean, progress: number): RealmStatus => {
  if (!unlocked) {
    return "locked";
  }
  return progress >= 100 ? "completed" : "unlocked";
};

const isFirstBoss = (boss: AdventureBoss, bosses: AdventureBoss[]) =>
  bosses
    .filter((item) => item.regionId === boss.regionId)
    .sort((left, right) => left.level - right.level)[0]?.id === boss.id;

const getChestUnlockCount = (chest: AdventureChest) => chest.unlockCount ?? 2;

const resetOptionalDates = <
  T extends { unlockedAt?: string; selectedAt?: string; defeatedAt?: string }
>(
  item: T
) => item;

const pruneGeneratedTables = async (database: PenRepsDatabase) => {
  const [mobs, bosses, regions, requirements, hitRequirements, chests] = await Promise.all([
    database.adventureMobs.toArray(),
    database.adventureBosses.toArray(),
    database.adventureRegions.toArray(),
    database.adventureMobRequirements.toArray(),
    database.adventureHitRequirements.toArray(),
    database.adventureChests.toArray()
  ]);

  await Promise.all([
    database.adventureMobs.bulkDelete(
      mobs.filter((item) => !generatedIds.mobs.has(item.id)).map((item) => item.id)
    ),
    database.adventureBosses.bulkDelete(
      bosses.filter((item) => !generatedIds.bosses.has(item.id)).map((item) => item.id)
    ),
    database.adventureRegions.bulkDelete(
      regions.filter((item) => !generatedIds.regions.has(item.id)).map((item) => item.id)
    ),
    database.adventureMobRequirements.bulkDelete(
      requirements.filter((item) => !generatedIds.requirements.has(item.id)).map((item) => item.id)
    ),
    database.adventureHitRequirements.bulkDelete(
      hitRequirements
        .filter((item) => !generatedIds.hitRequirements.has(item.id))
        .map((item) => item.id)
    ),
    database.adventureChests.bulkDelete(
      chests.filter((item) => !generatedIds.chests.has(item.id)).map((item) => item.id)
    )
  ]);
};

export const seedAdventureData = async (database: PenRepsDatabase = db) => {
  const timestamp = nowIso();
  const profileId = await getActiveProfileId(database);
  const [regionCount, mobCount, bossCount, chestCount, requirementCount, hitRequirementCount] =
    await Promise.all([
      database.adventureRegions.count(),
      database.adventureMobs.count(),
      database.adventureBosses.count(),
      database.adventureChests.count(),
      database.adventureMobRequirements.count(),
      database.adventureHitRequirements.count()
    ]);
  const contentSeeded =
    regionCount >= ADVENTURE_CONTENT.regions.length &&
    mobCount >= ADVENTURE_CONTENT.mobs.length &&
    bossCount >= ADVENTURE_CONTENT.bosses.length &&
    chestCount >= ADVENTURE_CONTENT.chests.length &&
    requirementCount >= ADVENTURE_CONTENT.requirements.length &&
    hitRequirementCount >= ADVENTURE_CONTENT.hitRequirements.length;

  const existingHero = await database.heroProgress.get("hero");
  if (!existingHero) {
    await database.heroProgress.put({
      id: "hero",
      profileId,
      heroName: "The Repbound",
      avatarId: "default",
      currentRegionId: "region_gate",
      selectedRealmId: "region_gate",
      currentHP: 100,
      maxHP: 100,
      unspentSkillPoints: 0,
      defeatedMobCount: 0,
      defeatedBossCount: 0,
      updatedAt: timestamp
    });
  } else {
    await database.heroProgress.put({
      ...existingHero,
      profileId: existingHero.profileId ?? profileId,
      currentRegionId: existingHero.currentRegionId || "region_gate",
      selectedRealmId:
        existingHero.selectedRealmId || existingHero.currentRegionId || "region_gate",
      currentHP: existingHero.currentHP ?? existingHero.maxHP ?? 100,
      maxHP: existingHero.maxHP ?? 100,
      updatedAt: timestamp
    });
  }

  if (!(await database.activeAdventureTarget.get("active"))) {
    await database.activeAdventureTarget.put({
      id: "active",
      realmId: existingHero?.selectedRealmId ?? "region_gate",
      updatedAt: timestamp
    });
  }

  for (const skill of HERO_SKILL_DEFINITIONS) {
    if (!(await database.heroSkills.get(skill.id))) {
      await database.heroSkills.put({ ...skill, level: 1, updatedAt: timestamp });
    }
  }

  if (!contentSeeded) {
    await pruneGeneratedTables(database);
    const [existingRegions, existingMobs, existingRequirements, existingBosses, existingChests] =
      await Promise.all([
        database.adventureRegions.toArray(),
        database.adventureMobs.toArray(),
        database.adventureMobRequirements.toArray(),
        database.adventureBosses.toArray(),
        database.adventureChests.toArray()
      ]);
    const regionById = new Map(existingRegions.map((item) => [item.id, item]));
    const mobById = new Map(existingMobs.map((item) => [item.id, item]));
    const requirementById = new Map(existingRequirements.map((item) => [item.id, item]));
    const bossById = new Map(existingBosses.map((item) => [item.id, item]));
    const chestById = new Map(existingChests.map((item) => [item.id, item]));

    await database.transaction(
      "rw",
      [
        database.adventureRegions,
        database.adventureMobs,
        database.adventureMobRequirements,
        database.adventureHitRequirements,
        database.adventureBosses,
        database.adventureChests
      ],
      async () => {
        await database.adventureRegions.bulkPut(
          ADVENTURE_CONTENT.regions.map((region) => {
            const existing = regionById.get(region.id);
            return {
              ...region,
              status: existing?.status ?? region.status,
              isUnlocked: existing?.isUnlocked ?? region.isUnlocked,
              progress: existing?.progress ?? region.progress
            };
          })
        );
        await database.adventureMobs.bulkPut(
          ADVENTURE_CONTENT.mobs.map((mob) => {
            const existing = mobById.get(mob.id);
            return {
              ...mob,
              status: existing?.status ?? mob.status,
              currentHP: existing?.currentHP ?? mob.currentHP,
              ...(existing?.unlockedAt ? { unlockedAt: existing.unlockedAt } : {}),
              ...(existing?.selectedAt ? { selectedAt: existing.selectedAt } : {}),
              ...(existing?.defeatedAt ? { defeatedAt: existing.defeatedAt } : {}),
              updatedAt: existing?.updatedAt ?? mob.updatedAt
            };
          })
        );
        await database.adventureMobRequirements.bulkPut(
          ADVENTURE_CONTENT.requirements.map((requirement) => {
            const existing = requirementById.get(requirement.id);
            return {
              ...requirement,
              currentValue: existing?.currentValue ?? requirement.currentValue,
              updatedAt: existing?.updatedAt ?? requirement.updatedAt
            };
          })
        );
        await database.adventureHitRequirements.bulkPut(ADVENTURE_CONTENT.hitRequirements);
        await database.adventureBosses.bulkPut(
          ADVENTURE_CONTENT.bosses.map((boss) => {
            const existing = bossById.get(boss.id);
            return {
              ...boss,
              status: existing?.status ?? boss.status,
              currentHP: existing?.currentHP ?? boss.currentHP,
              defeatProgress: existing?.defeatProgress ?? boss.defeatProgress,
              ...(existing?.unlockedAt ? { unlockedAt: existing.unlockedAt } : {}),
              ...(existing?.defeatedAt ? { defeatedAt: existing.defeatedAt } : {}),
              updatedAt: existing?.updatedAt ?? boss.updatedAt
            };
          })
        );
        await database.adventureChests.bulkPut(
          ADVENTURE_CONTENT.chests.map((chest) => {
            const existing = chestById.get(chest.id);
            return {
              ...chest,
              status: existing?.status ?? chest.status,
              ...(existing?.openedAt ? { openedAt: existing.openedAt } : {}),
              updatedAt: existing?.updatedAt ?? chest.updatedAt
            };
          })
        );
      }
    );
  }
};

const getSkillLevel = (skills: HeroSkill[], slug: HeroSkillSlug) =>
  skills.find((skill) => skill.slug === slug)?.level ?? 1;

const calculateMaxHP = (level: number, skills: HeroSkill[]) => {
  const enduranceLevel = getSkillLevel(skills, "endurance");
  return 100 + Math.max(0, level - 1) * 10 + Math.max(0, enduranceLevel - 1) * 10;
};

const isRegionUnlockedByIndex = (
  regionIndex: number,
  regions: AdventureRegion[],
  bosses: AdventureBoss[]
) => {
  if (regionIndex === 0) {
    return true;
  }
  const previousRegion = regions[regionIndex - 1];
  if (!previousRegion) {
    return false;
  }
  const previousBosses = bosses.filter((boss) => boss.regionId === previousRegion.id);
  return (
    previousRegion.status === "completed" ||
    (previousBosses.length > 0 && previousBosses.every((boss) => boss.status === "defeated"))
  );
};

export const recalculateAdventure = async (database: PenRepsDatabase = db) => {
  await seedAdventureData(database);
  const profileId = await getActiveProfileId(database);
  const [
    workouts,
    achievements,
    skills,
    existingHero,
    activeTarget,
    existingRegions,
    mobs,
    requirements,
    bosses,
    chests
  ] = await Promise.all([
    database.workouts
      .toArray()
      .then((items) => items.filter((item) => !item.profileId || item.profileId === profileId)),
    database.achievements.toArray(),
    database.heroSkills.toArray(),
    database.heroProgress.get("hero"),
    database.activeAdventureTarget.get("active"),
    database.adventureRegions.toArray(),
    database.adventureMobs.toArray(),
    database.adventureMobRequirements.toArray(),
    database.adventureBosses.toArray(),
    database.adventureChests.toArray()
  ]);

  const timestamp = nowIso();
  const regionsById = new Map(existingRegions.map((region) => [region.id, region]));
  const regions = ADVENTURE_CONTENT.regions.map((definition) => ({
    ...definition,
    ...(regionsById.get(definition.id) ?? {})
  }));
  const mobsByRealm = new Map<string, AdventureMob[]>();
  for (const mob of mobs) {
    mobsByRealm.set(mob.realmId, [...(mobsByRealm.get(mob.realmId) ?? []), mob]);
  }

  const nextRegions: AdventureRegion[] = [];
  let nextBosses = [...bosses];
  let nextChests = [...chests];

  for (let index = 0; index < regions.length; index += 1) {
    const region = regions[index];
    const regionMobs = mobsByRealm.get(region.id) ?? [];
    const defeatedMobs = regionMobs.filter((mob) => mob.status === "defeated").length;
    const regionUnlocked = isRegionUnlockedByIndex(index, nextRegions, nextBosses);
    nextChests = nextChests.map((chest) => {
      if (chest.realmId !== region.id || chest.status === "opened") {
        return chest;
      }
      const status: ChestStatus =
        regionUnlocked && defeatedMobs >= getChestUnlockCount(chest) ? "available" : "locked";
      return { ...chest, status, updatedAt: timestamp };
    });

    const realmChests = nextChests.filter((chest) => chest.realmId === region.id);
    const openedChests = realmChests.filter((chest) => chest.status === "opened").length;
    const firstChestOpened = realmChests[0]?.status === "opened";

    nextBosses = nextBosses.map((boss) => {
      if (boss.regionId !== region.id || boss.status === "defeated") {
        return boss;
      }
      const realmBosses = nextBosses
        .filter((item) => item.regionId === region.id)
        .sort((left, right) => left.level - right.level);
      const firstBoss = realmBosses[0];
      const firstBossDefeated = firstBoss?.status === "defeated";
      const unlocked =
        regionUnlocked &&
        (isFirstBoss(boss, realmBosses)
          ? firstChestOpened || defeatedMobs >= 2
          : firstBossDefeated && openedChests >= Math.min(1, realmChests.length));
      const status: BossStatus = unlocked ? "unlocked" : "locked";
      return {
        ...boss,
        status,
        ...(status === "unlocked" && !boss.unlockedAt ? { unlockedAt: timestamp } : {}),
        updatedAt: timestamp
      };
    });

    const realmBosses = nextBosses.filter((boss) => boss.regionId === region.id);
    const completedCount =
      defeatedMobs +
      realmChests.filter((chest) => chest.status === "opened").length +
      realmBosses.filter((boss) => boss.status === "defeated").length;
    const targetCount = regionMobs.length + realmChests.length + realmBosses.length;
    const progress =
      targetCount === 0 ? 0 : Math.min(100, Math.round((completedCount / targetCount) * 100));
    nextRegions.push({
      ...region,
      isUnlocked: regionUnlocked,
      status: getRegionStatus(regionUnlocked, progress),
      progress
    });
  }

  const unlockedRealmIds = new Set(
    nextRegions.filter((region) => region.isUnlocked).map((region) => region.id)
  );
  const activeMobId = activeTarget?.mobId;
  const nextMobs = mobs.map((mob) => {
    if (mob.status === "defeated") {
      return { ...mob, currentHP: 0, updatedAt: timestamp };
    }
    const regionUnlocked = unlockedRealmIds.has(mob.realmId);
    const status: MobStatus =
      regionUnlocked && mob.id === activeMobId
        ? "selected"
        : regionUnlocked
          ? "available"
          : "locked";
    return {
      ...resetOptionalDates(mob),
      status,
      currentHP: Math.min(Math.max(1, mob.currentHP ?? mob.maxHP), mob.maxHP),
      ...(regionUnlocked && !mob.unlockedAt ? { unlockedAt: timestamp } : {}),
      updatedAt: timestamp
    };
  });

  const nextRequirements = requirements.map((requirement) => {
    const mob = nextMobs.find((item) => item.id === requirement.mobId);
    if (!mob) {
      return requirement;
    }
    const currentValue =
      mob.status === "defeated"
        ? requirement.requiredValue
        : Math.max(0, mob.maxHP - mob.currentHP);
    return {
      ...requirement,
      requiredValue: mob.maxHP,
      currentValue: Math.min(requirement.requiredValue, currentValue),
      updatedAt: timestamp
    };
  });

  const fallbackRealm =
    nextRegions.find((region) => region.id === existingHero?.selectedRealmId && region.isUnlocked)
      ?.id ??
    nextRegions.find((region) => region.id === existingHero?.currentRegionId && region.isUnlocked)
      ?.id ??
    "region_gate";
  const currentRegionId =
    [...nextRegions].reverse().find((region) => region.isUnlocked)?.id ?? "region_gate";
  const defeatedMobs = nextMobs.filter((mob) => mob.status === "defeated");
  const defeatedBosses = nextBosses.filter((boss) => boss.status === "defeated");
  const openedChests = nextChests.filter((chest) => chest.status === "opened");
  const workoutXP = workouts.reduce((total, workout) => total + workout.xpAwarded, 0);
  const rewardXP =
    defeatedMobs.reduce((total, mob) => total + mob.rewardXP, 0) +
    defeatedBosses.reduce((total, boss) => total + boss.rewardXP, 0) +
    openedChests.reduce((total, chest) => total + chest.rewardXP, 0);
  const totalXP = workoutXP + rewardXP;
  const level = getLevelFromXP(totalXP);
  const spentSkillPoints = skills.reduce((total, skill) => total + Math.max(0, skill.level - 1), 0);
  const achievementSkillPoints =
    (achievements.some((item) => item.slug === "7-day-streak" && item.unlockedAt) ? 1 : 0) +
    (achievements.some((item) => item.slug === "first-custom-activity" && item.unlockedAt) ? 1 : 0);
  const earnedSkillPoints =
    Math.max(0, level - 1) +
    defeatedMobs.reduce((total, mob) => total + mob.rewardSkillPoints, 0) +
    defeatedBosses.reduce((total, boss) => total + boss.rewardSkillPoints, 0) +
    openedChests.reduce((total, chest) => total + chest.rewardSkillPoints, 0) +
    achievementSkillPoints;
  const maxHP = calculateMaxHP(level, skills);
  const hero: HeroProgress = {
    id: "hero",
    profileId,
    heroName: existingHero?.heroName ?? "The Repbound",
    avatarId: existingHero?.avatarId ?? "default",
    currentRegionId,
    selectedRealmId: fallbackRealm,
    currentHP: Math.min(existingHero?.currentHP ?? maxHP, maxHP),
    maxHP,
    unspentSkillPoints: Math.max(0, earnedSkillPoints - spentSkillPoints),
    defeatedMobCount: defeatedMobs.length,
    defeatedBossCount: defeatedBosses.length,
    updatedAt: timestamp
  };

  const retainedMob = activeTarget?.mobId
    ? nextMobs.find((mob) => mob.id === activeTarget.mobId && mob.status === "selected")
    : undefined;
  const retainedBoss = activeTarget?.bossId
    ? nextBosses.find((boss) => boss.id === activeTarget.bossId && boss.status === "unlocked")
    : undefined;
  const nextTarget: ActiveAdventureTarget = {
    id: "active",
    realmId: fallbackRealm,
    ...(retainedMob ? { mobId: retainedMob.id } : {}),
    ...(retainedBoss ? { bossId: retainedBoss.id } : {}),
    updatedAt: timestamp
  };

  await database.transaction(
    "rw",
    [
      database.heroProgress,
      database.userProgress,
      database.adventureProgress,
      database.adventureRegions,
      database.adventureBosses,
      database.adventureChests,
      database.adventureMobs,
      database.adventureMobRequirements,
      database.activeAdventureTarget
    ],
    async () => {
      await database.heroProgress.put(hero);
      await database.userProgress.put({ id: "user", totalXP, level, updatedAt: timestamp });
      const adventureProgress: AdventureProgress = {
        id: profileId,
        profileId,
        selectedRealmId: fallbackRealm,
        ...(nextTarget.mobId ? { activeMobId: nextTarget.mobId } : {}),
        ...(nextTarget.bossId ? { activeBossId: nextTarget.bossId } : {}),
        unlockedRealmIds: nextRegions
          .filter((region) => region.isUnlocked)
          .map((region) => region.id),
        defeatedEnemyIds: defeatedMobs.map((mob) => mob.id),
        defeatedBossIds: defeatedBosses.map((boss) => boss.id),
        openedChestIds: openedChests.map((chest) => chest.id),
        xpRewarded: rewardXP,
        updatedAt: timestamp
      };
      await database.adventureProgress.put(adventureProgress);
      await database.adventureRegions.bulkPut(nextRegions);
      await database.adventureBosses.bulkPut(nextBosses);
      await database.adventureChests.bulkPut(nextChests);
      await database.adventureMobs.bulkPut(nextMobs);
      await database.adventureMobRequirements.bulkPut(nextRequirements);
      await database.activeAdventureTarget.put(nextTarget);
    }
  );

  return hero;
};

export const listAdventureState = async (database: PenRepsDatabase = db) => {
  await recalculateAdventure(database);
  const profileId = await getActiveProfileId(database);
  const [
    hero,
    skills,
    regions,
    bosses,
    chests,
    mobs,
    mobRequirements,
    hitRequirements,
    activeTarget,
    events
  ] = await Promise.all([
    database.heroProgress.get("hero"),
    database.heroSkills.toArray(),
    database.adventureRegions.toArray(),
    database.adventureBosses.toArray(),
    database.adventureChests.toArray(),
    database.adventureMobs.toArray(),
    database.adventureMobRequirements.toArray(),
    database.adventureHitRequirements.toArray(),
    database.activeAdventureTarget.get("active"),
    database.adventureEvents
      .orderBy("createdAt")
      .reverse()
      .limit(50)
      .toArray()
      .then((items) => items.filter((item) => !item.profileId || item.profileId === profileId))
  ]);

  return {
    hero,
    skills,
    regions,
    bosses,
    chests,
    mobs,
    mobRequirements,
    hitRequirements,
    activeTarget,
    events
  };
};

export const selectAdventureRealm = async (realmId: string, database: PenRepsDatabase = db) => {
  await recalculateAdventure(database);
  const [hero, region, activeTarget, mob, boss] = await Promise.all([
    database.heroProgress.get("hero"),
    database.adventureRegions.get(realmId),
    database.activeAdventureTarget.get("active"),
    database.activeAdventureTarget
      .get("active")
      .then((target) => (target?.mobId ? database.adventureMobs.get(target.mobId) : undefined)),
    database.activeAdventureTarget
      .get("active")
      .then((target) => (target?.bossId ? database.adventureBosses.get(target.bossId) : undefined))
  ]);

  if (!hero || !region?.isUnlocked) {
    throw new Error("Realm is locked.");
  }
  const timestamp = nowIso();
  const keepMob = mob?.realmId === realmId && mob.status === "selected" ? mob.id : undefined;
  const keepBoss = boss?.regionId === realmId && boss.status === "unlocked" ? boss.id : undefined;
  await database.transaction(
    "rw",
    database.heroProgress,
    database.activeAdventureTarget,
    async () => {
      await database.heroProgress.put({ ...hero, selectedRealmId: realmId, updatedAt: timestamp });
      await database.activeAdventureTarget.put({
        id: "active",
        realmId,
        ...(keepMob ? { mobId: keepMob } : {}),
        ...(keepBoss ? { bossId: keepBoss } : {}),
        updatedAt: timestamp
      });
    }
  );
  void activeTarget;
};

export const selectMobTarget = async (mobId: string, database: PenRepsDatabase = db) => {
  await recalculateAdventure(database);
  const profileId = await getActiveProfileId(database);
  const [mob, target, mobs] = await Promise.all([
    database.adventureMobs.get(mobId),
    database.activeAdventureTarget.get("active"),
    database.adventureMobs.toArray()
  ]);
  if (!mob || mob.status === "locked" || mob.status === "defeated") {
    throw new Error("Enemy is not available.");
  }
  const timestamp = nowIso();
  const nextMobs = mobs.map((item) => {
    if (item.status === "defeated" || item.status === "locked") {
      return item;
    }
    if (item.id === mobId) {
      return { ...item, status: "selected" as const, selectedAt: timestamp, updatedAt: timestamp };
    }
    return { ...item, status: "available" as const, updatedAt: timestamp };
  });
  await database.transaction(
    "rw",
    database.adventureMobs,
    database.activeAdventureTarget,
    database.adventureEvents,
    async () => {
      await database.adventureMobs.bulkPut(nextMobs);
      await database.activeAdventureTarget.put({
        id: "active",
        realmId: mob.realmId,
        mobId,
        ...(target?.bossId ? { bossId: target.bossId } : {}),
        updatedAt: timestamp
      });
      await database.adventureEvents.add(
        createEvent(
          "mob_selected",
          `${mob.title} fight started`,
          "A Battle View is ready.",
          timestamp,
          profileId
        )
      );
    }
  );
};

export const selectBossTarget = async (bossId: string, database: PenRepsDatabase = db) => {
  await recalculateAdventure(database);
  const [boss, target] = await Promise.all([
    database.adventureBosses.get(bossId),
    database.activeAdventureTarget.get("active")
  ]);
  if (!boss || boss.status !== "unlocked") {
    throw new Error("Boss is not available.");
  }
  const timestamp = nowIso();
  await database.activeAdventureTarget.put({
    id: "active",
    realmId: boss.regionId,
    ...(target?.mobId ? { mobId: target.mobId } : {}),
    bossId,
    updatedAt: timestamp
  });
};

export const openAdventureChest = async (chestId: string, database: PenRepsDatabase = db) => {
  await recalculateAdventure(database);
  const profileId = await getActiveProfileId(database);
  const chest = await database.adventureChests.get(chestId);
  if (!chest || chest.status !== "available") {
    throw new Error("Chest is locked.");
  }
  const timestamp = nowIso();
  await database.transaction("rw", database.adventureChests, database.adventureEvents, async () => {
    await database.adventureChests.put({
      ...chest,
      status: "opened",
      openedAt: timestamp,
      updatedAt: timestamp
    });
    await database.adventureEvents.add(
      createEvent(
        "chest_opened",
        `${chest.title} opened`,
        `Reward claimed: ${chest.rewardXP} XP.`,
        timestamp,
        profileId
      )
    );
  });
  await recalculateAdventure(database);
};

export const clearActiveAdventureFight = async (database: PenRepsDatabase = db) => {
  await seedAdventureData(database);
  const target = await database.activeAdventureTarget.get("active");
  if (!target) {
    return;
  }
  await database.activeAdventureTarget.put({
    id: "active",
    realmId: target.realmId,
    updatedAt: nowIso()
  });
};

const baseDamageFor = (metric: AdventureHitMetric, value: number) => {
  if (metric === "seconds") {
    return Math.floor(value / 10);
  }
  if (metric === "distanceMeters") {
    return Math.floor(value / 100);
  }
  return value;
};

const skillSlugForActivity = (activityType: ActivityType): HeroSkillSlug => {
  if (activityType === "timed") {
    return "focus";
  }
  if (activityType === "cardio") {
    return "agility";
  }
  return "power";
};

const inferActivityType = (hit: AdventureHitRequirement): ActivityType => {
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
};

const calculateDamage = (
  hit: AdventureHitRequirement,
  loggedValue: number,
  weakness: ActivityType,
  skills: HeroSkill[]
) => {
  const activityType = inferActivityType(hit);
  const baseDamage = Math.max(1, baseDamageFor(hit.metric, loggedValue));
  const skillLevel = getSkillLevel(skills, skillSlugForActivity(activityType));
  const luckLevel = getSkillLevel(skills, "luck");
  const skillMultiplier = 1 + Math.max(0, skillLevel - 1) * 0.02;
  const weaknessMultiplier = activityType === weakness ? 1.15 : 1;
  const criticalChance = Math.min(0.3, 0.05 + Math.max(0, luckLevel - 1) * 0.015);
  const critical = Math.random() < criticalChance;
  const criticalMultiplier = critical ? 1.5 : 1;
  const finalDamage = Math.max(
    1,
    Math.floor(baseDamage * skillMultiplier * weaknessMultiplier * criticalMultiplier)
  );
  return { baseDamage, finalDamage, critical };
};

const calculateEnemyDamage = (attackPower: number, skills: HeroSkill[]) => {
  const enduranceLevel = getSkillLevel(skills, "endurance");
  const agilityLevel = getSkillLevel(skills, "agility");
  const dodgeChance = Math.min(0.25, Math.max(0, agilityLevel - 1) * 0.01);
  const dodged = Math.random() < dodgeChance;
  if (dodged) {
    return { enemyDamage: 0, dodged };
  }
  const enduranceReduction = Math.floor(Math.max(0, enduranceLevel - 1) * 1.2);
  return { enemyDamage: Math.max(1, attackPower - enduranceReduction), dodged };
};

const getEnemyRecord = async (enemyId: string, database: PenRepsDatabase) => {
  const mob = await database.adventureMobs.get(enemyId);
  if (mob) {
    return { kind: "mob" as const, enemy: mob };
  }
  const boss = await database.adventureBosses.get(enemyId);
  if (boss) {
    return { kind: "boss" as const, enemy: boss };
  }
  return undefined;
};

export const resolveAdventureHit = async (
  input: AdventureHitInput,
  database: PenRepsDatabase = db
): Promise<AdventureBattleResult> => {
  await recalculateAdventure(database);
  const profileId = await getActiveProfileId(database);
  const [enemyRecord, hit, hero, skills, target] = await Promise.all([
    getEnemyRecord(input.enemyId, database),
    database.adventureHitRequirements.where("enemyId").equals(input.enemyId).first(),
    database.heroProgress.get("hero"),
    database.heroSkills.toArray(),
    database.activeAdventureTarget.get("active")
  ]);

  if (!enemyRecord || !hit || !hero) {
    throw new Error("Battle target not found.");
  }
  if (input.metric !== hit.metric || input.loggedValue < hit.requiredValue) {
    throw new Error("Required hit is not complete.");
  }

  const timestamp = nowIso();
  const isBoss = enemyRecord.kind === "boss";
  const activeMatches = isBoss ? target?.bossId === input.enemyId : target?.mobId === input.enemyId;
  if (!activeMatches) {
    throw new Error("This is not the active fight.");
  }

  const enemy = enemyRecord.enemy;
  const { baseDamage, finalDamage, critical } = calculateDamage(
    hit,
    input.loggedValue,
    enemy.weakness,
    skills
  );
  const nextEnemyHP = Math.max(0, enemy.currentHP - finalDamage);
  const victory = nextEnemyHP <= 0;
  const counter = victory
    ? { enemyDamage: 0, dodged: false }
    : calculateEnemyDamage(enemy.attackPower, skills);
  const nextHeroHP = Math.max(0, hero.currentHP - counter.enemyDamage);
  const defeat = !victory && nextHeroHP <= 0;
  const rewardXP = victory ? enemy.rewardXP : 0;
  const rewardSkillPoints = victory ? enemy.rewardSkillPoints : 0;
  const log = [
    `You hit ${enemy.title} for ${finalDamage} damage.`,
    ...(critical ? ["Critical hit!"] : []),
    ...(victory
      ? [`${enemy.title} defeated.`]
      : counter.dodged
        ? ["Dodged!"]
        : [`${enemy.title} hit you for ${counter.enemyDamage} HP.`]),
    ...(defeat ? ["You fell. The realm remains."] : [])
  ];

  const enemyRealmId =
    enemyRecord.kind === "boss" ? enemyRecord.enemy.regionId : enemyRecord.enemy.realmId;
  const enemyType =
    enemyRecord.kind === "boss"
      ? "boss"
      : enemyRecord.enemy.enemyType === "elite"
        ? "elite"
        : "enemy";
  const nextTarget: ActiveAdventureTarget = {
    id: "active",
    realmId: target?.realmId ?? enemyRealmId,
    ...(!victory && !defeat && target?.mobId ? { mobId: target.mobId } : {}),
    ...(!victory && !defeat && target?.bossId ? { bossId: target.bossId } : {}),
    updatedAt: timestamp
  };

  await database.transaction(
    "rw",
    [
      database.heroProgress,
      database.adventureMobs,
      database.adventureMobRequirements,
      database.adventureBosses,
      database.activeAdventureTarget,
      database.adventureEvents
    ],
    async () => {
      await database.heroProgress.put({
        ...hero,
        currentHP: defeat ? hero.maxHP : nextHeroHP,
        updatedAt: timestamp
      });

      if (enemyRecord.kind === "mob") {
        const nextMob: AdventureMob = {
          ...enemyRecord.enemy,
          currentHP: defeat ? enemyRecord.enemy.maxHP : nextEnemyHP,
          status: victory ? "defeated" : defeat ? "available" : "selected",
          ...(victory ? { defeatedAt: timestamp } : {}),
          updatedAt: timestamp
        };
        const requirement = await database.adventureMobRequirements
          .where("mobId")
          .equals(enemyRecord.enemy.id)
          .first();
        await database.adventureMobs.put(nextMob);
        if (requirement) {
          await database.adventureMobRequirements.put({
            ...requirement,
            currentValue: victory
              ? requirement.requiredValue
              : defeat
                ? 0
                : Math.max(0, nextMob.maxHP - nextEnemyHP),
            updatedAt: timestamp
          });
        }
      } else {
        await database.adventureBosses.put({
          ...enemyRecord.enemy,
          currentHP: defeat ? enemyRecord.enemy.maxHP : nextEnemyHP,
          status: victory ? "defeated" : "unlocked",
          defeatProgress: victory
            ? enemyRecord.enemy.defeatTarget
            : enemyRecord.enemy.maxHP - nextEnemyHP,
          ...(victory ? { defeatedAt: timestamp } : {}),
          updatedAt: timestamp
        });
      }

      await database.activeAdventureTarget.put(nextTarget);
      await database.adventureEvents.add(
        createEvent(
          victory ? (isBoss ? "boss_defeated" : "mob_defeated") : "mob_damaged",
          victory ? `${enemy.title} defeated` : `${enemy.title} damaged`,
          victory
            ? `Reward claimed: ${rewardXP} XP and ${rewardSkillPoints} skill points.`
            : `${finalDamage} damage dealt. ${defeat ? "You fell and the fight reset." : "The fight continues."}`,
          timestamp,
          profileId
        )
      );
    }
  );

  await recalculateAdventure(database);

  return {
    enemyId: enemy.id,
    enemyTitle: enemy.title,
    enemyType,
    baseDamage,
    finalDamage,
    enemyDamage: counter.enemyDamage,
    critical,
    dodged: counter.dodged,
    victory,
    defeat,
    enemyHP: victory || defeat ? (defeat ? enemy.maxHP : 0) : nextEnemyHP,
    enemyMaxHP: enemy.maxHP,
    heroHP: defeat ? hero.maxHP : nextHeroHP,
    heroMaxHP: hero.maxHP,
    rewardXP,
    rewardSkillPoints,
    log
  };
};

export const restAdventureHero = async (database: PenRepsDatabase = db) => {
  const hero = await recalculateAdventure(database);
  const skills = await database.heroSkills.toArray();
  const heal = 8 + Math.max(0, getSkillLevel(skills, "endurance") - 1) * 2;
  const nextHero = {
    ...hero,
    currentHP: Math.min(hero.maxHP, hero.currentHP + heal),
    updatedAt: nowIso()
  };
  await database.heroProgress.put(nextHero);
  return { hero: nextHero, heal };
};

export const fleeAdventureBattle = async (database: PenRepsDatabase = db) => {
  await recalculateAdventure(database);
  const [target, mob, boss] = await Promise.all([
    database.activeAdventureTarget.get("active"),
    database.activeAdventureTarget
      .get("active")
      .then((item) => (item?.mobId ? database.adventureMobs.get(item.mobId) : undefined)),
    database.activeAdventureTarget
      .get("active")
      .then((item) => (item?.bossId ? database.adventureBosses.get(item.bossId) : undefined))
  ]);
  if (!target) {
    return;
  }
  const timestamp = nowIso();
  await database.transaction(
    "rw",
    database.adventureMobs,
    database.adventureMobRequirements,
    database.adventureBosses,
    database.activeAdventureTarget,
    async () => {
      if (mob && mob.status !== "defeated") {
        await database.adventureMobs.put({
          ...mob,
          currentHP: mob.maxHP,
          status: "available",
          updatedAt: timestamp
        });
        const requirement = await database.adventureMobRequirements
          .where("mobId")
          .equals(mob.id)
          .first();
        if (requirement) {
          await database.adventureMobRequirements.put({
            ...requirement,
            currentValue: 0,
            updatedAt: timestamp
          });
        }
      }
      if (boss && boss.status !== "defeated") {
        await database.adventureBosses.put({
          ...boss,
          currentHP: boss.maxHP,
          defeatProgress: 0,
          updatedAt: timestamp
        });
      }
      await database.activeAdventureTarget.put({
        id: "active",
        realmId: target.realmId,
        updatedAt: timestamp
      });
    }
  );
};

export const applyWorkoutToAdventureTargets = async (
  _workoutId?: string,
  _database: PenRepsDatabase = db
) => undefined;

export const upgradeHeroSkill = async (slug: HeroSkillSlug, database: PenRepsDatabase = db) => {
  const hero = await recalculateAdventure(database);
  const profileId = await getActiveProfileId(database);
  if (hero.unspentSkillPoints <= 0) {
    throw new Error("No skill points available.");
  }
  const skill = await database.heroSkills.where("slug").equals(slug).first();
  if (!skill) {
    throw new Error("Skill not found.");
  }
  const timestamp = nowIso();
  const nextSkill = { ...skill, level: skill.level + 1, updatedAt: timestamp };
  const nextHero = {
    ...hero,
    unspentSkillPoints: hero.unspentSkillPoints - 1,
    updatedAt: timestamp
  };
  await database.transaction(
    "rw",
    database.heroProgress,
    database.heroSkills,
    database.adventureEvents,
    async () => {
      await database.heroSkills.put(nextSkill);
      await database.heroProgress.put(nextHero);
      await database.adventureEvents.add(
        createEvent(
          "skill_upgraded",
          `${skill.name} upgraded`,
          `The Repbound invested in ${skill.name}.`,
          timestamp,
          profileId
        )
      );
    }
  );
  return nextSkill;
};
