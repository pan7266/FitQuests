export interface CharacterOption {
  id: string;
  nameKey: string;
  roleKey: string;
  descriptionKey: string;
  iconKey: string;
  portraitKey: string;
  themeColor: string;
  gradient: string;
  fallbackIcon: string;
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: "default",
    nameKey: "characters.shadowHunter.name",
    roleKey: "characters.shadowHunter.role",
    descriptionKey: "characters.shadowHunter.description",
    iconKey: "shadow-hunter",
    portraitKey: "shadow-hunter",
    themeColor: "#2563EB",
    gradient: "linear-gradient(135deg, #111827, var(--accent))",
    fallbackIcon: "spark"
  },
  {
    id: "crimson",
    nameKey: "characters.crimsonBlade.name",
    roleKey: "characters.crimsonBlade.role",
    descriptionKey: "characters.crimsonBlade.description",
    iconKey: "crimson-blade",
    portraitKey: "crimson-blade",
    themeColor: "#DC2626",
    gradient: "linear-gradient(135deg, #450A0A, #DC2626)",
    fallbackIcon: "blade"
  },
  {
    id: "frost",
    nameKey: "characters.frostRanger.name",
    roleKey: "characters.frostRanger.role",
    descriptionKey: "characters.frostRanger.description",
    iconKey: "frost-ranger",
    portraitKey: "frost-ranger",
    themeColor: "#0891B2",
    gradient: "linear-gradient(135deg, #083344, #67E8F9)",
    fallbackIcon: "bow"
  },
  {
    id: "iron",
    nameKey: "characters.ironGuardian.name",
    roleKey: "characters.ironGuardian.role",
    descriptionKey: "characters.ironGuardian.description",
    iconKey: "iron-guardian",
    portraitKey: "iron-guardian",
    themeColor: "#64748B",
    gradient: "linear-gradient(135deg, #0F172A, #94A3B8)",
    fallbackIcon: "shield"
  },
  {
    id: "arcane",
    nameKey: "characters.arcaneStriker.name",
    roleKey: "characters.arcaneStriker.role",
    descriptionKey: "characters.arcaneStriker.description",
    iconKey: "arcane-striker",
    portraitKey: "arcane-striker",
    themeColor: "#7C3AED",
    gradient: "linear-gradient(135deg, #2E1065, #A78BFA)",
    fallbackIcon: "rune"
  },
  {
    id: "silent",
    nameKey: "characters.silentAssassin.name",
    roleKey: "characters.silentAssassin.role",
    descriptionKey: "characters.silentAssassin.description",
    iconKey: "silent-assassin",
    portraitKey: "silent-assassin",
    themeColor: "#DB2777",
    gradient: "linear-gradient(135deg, #500724, #F472B6)",
    fallbackIcon: "dagger"
  },
  {
    id: "storm",
    nameKey: "characters.stormBreaker.name",
    roleKey: "characters.stormBreaker.role",
    descriptionKey: "characters.stormBreaker.description",
    iconKey: "storm-breaker",
    portraitKey: "storm-breaker",
    themeColor: "#2563EB",
    gradient: "linear-gradient(135deg, #172554, #38BDF8)",
    fallbackIcon: "bolt"
  },
  {
    id: "void",
    nameKey: "characters.voidKnight.name",
    roleKey: "characters.voidKnight.role",
    descriptionKey: "characters.voidKnight.description",
    iconKey: "void-knight",
    portraitKey: "void-knight",
    themeColor: "#6366F1",
    gradient: "linear-gradient(135deg, #020617, #6366F1)",
    fallbackIcon: "helm"
  },
  {
    id: "ember",
    nameKey: "characters.emberMonk.name",
    roleKey: "characters.emberMonk.role",
    descriptionKey: "characters.emberMonk.description",
    iconKey: "ember-monk",
    portraitKey: "ember-monk",
    themeColor: "#EA580C",
    gradient: "linear-gradient(135deg, #431407, #FB923C)",
    fallbackIcon: "flame"
  },
  {
    id: "moon",
    nameKey: "characters.moonArcher.name",
    roleKey: "characters.moonArcher.role",
    descriptionKey: "characters.moonArcher.description",
    iconKey: "moon-archer",
    portraitKey: "moon-archer",
    themeColor: "#64748B",
    gradient: "linear-gradient(135deg, #1E293B, #E2E8F0)",
    fallbackIcon: "moon"
  }
];

export const getCharacterOption = (characterId: string) =>
  CHARACTER_OPTIONS.find((character) => character.id === characterId) ?? CHARACTER_OPTIONS[0];
