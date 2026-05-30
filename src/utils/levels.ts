export interface LevelProgress {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percent: number;
}

export const getLevelFromXP = (totalXP: number) =>
  Math.floor(Math.sqrt(Math.max(0, totalXP) / 100)) + 1;

export const getXPForLevel = (level: number) => {
  const safeLevel = Math.max(1, Math.floor(level));
  return (safeLevel - 1) ** 2 * 100;
};

export const getCurrentLevelProgress = (totalXP: number): LevelProgress => {
  const safeXP = Math.max(0, Math.floor(totalXP));
  const level = getLevelFromXP(safeXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpIntoLevel = safeXP - currentLevelXP;
  const xpForNextLevel = nextLevelXP - currentLevelXP;
  const percent = xpForNextLevel === 0 ? 100 : Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);

  return {
    level,
    currentLevelXP,
    nextLevelXP,
    xpIntoLevel,
    xpForNextLevel,
    percent
  };
};
