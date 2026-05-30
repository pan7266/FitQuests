import type {
  AdventureBoss,
  AdventureChest,
  AdventureMob,
  AdventureRegion,
  MobStatus,
  RealmStatus
} from "../db/schema";

export type VisualState =
  | "locked"
  | "available"
  | "selected"
  | "active"
  | "defeated"
  | "opened"
  | "completed";

export type EnemyVisualType = "normal" | "elite" | "boss" | "realmBoss" | "chest";

export interface EnemyVisual {
  id: string;
  realmId: string;
  name: string;
  type: EnemyVisualType;
  level: number;
  hp: number;
  attack: number;
  weakness: string;
  requiredExercise: string;
  rewardXp: number;
  iconKey: string;
  portraitKey: string;
  battleImageKey: string;
  silhouetteType: string;
  visualTheme: string;
  themeColor: string;
}

export interface RealmVisual {
  id: string;
  titleKey: string;
  descriptionKey: string;
  themeColor: string;
  backgroundGradient: string;
  realmImageKey: string;
  bannerImageKey: string;
  thumbnailImageKey: string;
}

const realmVisuals: Record<string, RealmVisual> = {
  region_gate: {
    id: "region_gate",
    titleKey: "realms.trainingGate",
    descriptionKey: "realms.trainingGateDescription",
    themeColor: "#2563EB",
    backgroundGradient:
      "radial-gradient(circle at 20% 15%, rgba(37,99,235,.38), transparent 34%), linear-gradient(135deg, #050816, #111827 48%, #172554)",
    realmImageKey: "training-gate",
    bannerImageKey: "gate-banner",
    thumbnailImageKey: "gate-thumb"
  },
  region_forest: {
    id: "region_forest",
    titleKey: "realms.goblinMine",
    descriptionKey: "realms.goblinMineDescription",
    themeColor: "#16A34A",
    backgroundGradient:
      "radial-gradient(circle at 72% 18%, rgba(34,197,94,.34), transparent 32%), linear-gradient(135deg, #031B12, #0F2F24 52%, #064E3B)",
    realmImageKey: "goblin-mine",
    bannerImageKey: "forest-banner",
    thumbnailImageKey: "forest-thumb"
  },
  region_caves: {
    id: "region_caves",
    titleKey: "realms.spiderCavern",
    descriptionKey: "realms.spiderCavernDescription",
    themeColor: "#7C3AED",
    backgroundGradient:
      "radial-gradient(circle at 45% 12%, rgba(124,58,237,.36), transparent 34%), linear-gradient(135deg, #0F0524, #1E1B4B 50%, #312E81)",
    realmImageKey: "spider-cavern",
    bannerImageKey: "caves-banner",
    thumbnailImageKey: "caves-thumb"
  },
  region_iron: {
    id: "region_iron",
    titleKey: "realms.redGate",
    descriptionKey: "realms.redGateDescription",
    themeColor: "#DC2626",
    backgroundGradient:
      "radial-gradient(circle at 70% 20%, rgba(220,38,38,.38), transparent 32%), linear-gradient(135deg, #1F0707, #3F1111 50%, #7F1D1D)",
    realmImageKey: "red-gate",
    bannerImageKey: "iron-banner",
    thumbnailImageKey: "iron-thumb"
  },
  region_plateau: {
    id: "region_plateau",
    titleKey: "realms.frostDungeon",
    descriptionKey: "realms.frostDungeonDescription",
    themeColor: "#0891B2",
    backgroundGradient:
      "radial-gradient(circle at 35% 14%, rgba(103,232,249,.34), transparent 32%), linear-gradient(135deg, #082F49, #164E63 52%, #0F172A)",
    realmImageKey: "frost-dungeon",
    bannerImageKey: "plateau-banner",
    thumbnailImageKey: "plateau-thumb"
  },
  region_storm: {
    id: "region_storm",
    titleKey: "realms.shadowCitadel",
    descriptionKey: "realms.shadowCitadelDescription",
    themeColor: "#A855F7",
    backgroundGradient:
      "radial-gradient(circle at 52% 10%, rgba(168,85,247,.42), transparent 32%), linear-gradient(135deg, #020617, #111827 46%, #3B0764)",
    realmImageKey: "shadow-citadel",
    bannerImageKey: "citadel-banner",
    thumbnailImageKey: "citadel-thumb"
  }
};

const iconKeys = [
  "gate-slime",
  "hollow-goblin",
  "bone-crawler",
  "dungeon-wraith",
  "iron-fang",
  "shadow-beast",
  "frost-spider",
  "red-gate-brute",
  "abyss-knight",
  "void-reaper"
];

const bossKeys = [
  "first-gatekeeper",
  "fatigue-monarch",
  "crimson-dungeon-lord",
  "hollow-commander",
  "shadow-tyrant",
  "frost-gate-queen",
  "ancient-delay-beast",
  "final-threshold"
];

export const resolveRealmVisual = (realmId: string | undefined): RealmVisual =>
  realmVisuals[realmId ?? "region_gate"] ?? realmVisuals.region_gate;

export const resolveRealmState = (region: AdventureRegion): VisualState => {
  if (!region.isUnlocked || region.status === "locked") {
    return "locked";
  }
  if (region.status === "completed") {
    return "completed";
  }
  return region.progress > 0 ? "active" : "available";
};

export const resolveEnemyVisual = (
  enemy: AdventureMob | AdventureBoss,
  requiredExercise: string,
  type?: EnemyVisualType
): EnemyVisual => {
  const isBoss = "regionId" in enemy;
  const realmId = isBoss ? enemy.regionId : enemy.realmId;
  const resolvedType: EnemyVisualType =
    type ?? (isBoss ? "boss" : enemy.enemyType === "elite" ? "elite" : "normal");
  const visual = resolveRealmVisual(realmId);
  const hash = hashString(enemy.slug ?? enemy.id);
  const keyPool = resolvedType === "boss" || resolvedType === "realmBoss" ? bossKeys : iconKeys;
  const iconKey = keyPool[hash % keyPool.length];

  return {
    id: enemy.id,
    realmId,
    name: enemy.title,
    type: resolvedType,
    level: enemy.level,
    hp: enemy.currentHP,
    attack: enemy.attackPower,
    weakness: enemy.weakness,
    requiredExercise,
    rewardXp: enemy.rewardXP,
    iconKey,
    portraitKey: `${iconKey}-portrait`,
    battleImageKey: `${iconKey}-battle`,
    silhouetteType: getSilhouetteType(iconKey, resolvedType),
    visualTheme: visual.realmImageKey,
    themeColor: visual.themeColor
  };
};

export const resolveChestVisual = (chest: AdventureChest): EnemyVisual => {
  const visual = resolveRealmVisual(chest.realmId);
  return {
    id: chest.id,
    realmId: chest.realmId,
    name: chest.title,
    type: "chest",
    level: chest.unlockCount,
    hp: 0,
    attack: 0,
    weakness: "reward",
    requiredExercise: chest.unlockRequirement,
    rewardXp: chest.rewardXP,
    iconKey: "relic-chest",
    portraitKey: "relic-chest-portrait",
    battleImageKey: "relic-chest-battle",
    silhouetteType: "vault",
    visualTheme: visual.realmImageKey,
    themeColor: "#F59E0B"
  };
};

export const mapMobState = (status: MobStatus, active: boolean): VisualState => {
  if (status === "defeated") {
    return "defeated";
  }
  if (active || status === "selected") {
    return "active";
  }
  return status;
};

export const mapBossState = (
  status: "locked" | "unlocked" | "defeated",
  active: boolean
): VisualState => {
  if (status === "defeated") {
    return "defeated";
  }
  if (active) {
    return "active";
  }
  return status === "unlocked" ? "available" : "locked";
};

export const mapRealmState = (status: RealmStatus, isUnlocked: boolean): VisualState => {
  if (!isUnlocked || status === "locked") {
    return "locked";
  }
  return status === "completed" ? "completed" : "available";
};

const hashString = (value: string) =>
  [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);

const getSilhouetteType = (iconKey: string, type: EnemyVisualType) => {
  if (type === "boss" || type === "realmBoss") {
    return "towering";
  }
  if (iconKey.includes("spider") || iconKey.includes("crawler")) {
    return "low-beast";
  }
  if (iconKey.includes("wraith") || iconKey.includes("reaper")) {
    return "floating";
  }
  if (iconKey.includes("knight") || iconKey.includes("brute")) {
    return "armored";
  }
  return "beast";
};
