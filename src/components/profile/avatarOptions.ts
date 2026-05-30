import { Flame, Gem, Moon, Shield, Sparkles, Swords, Zap } from "lucide-react";
import { CHARACTER_OPTIONS, getCharacterOption } from "../../data/characters";

const fallbackIcons = {
  blade: Swords,
  bolt: Zap,
  bow: Sparkles,
  dagger: Swords,
  flame: Flame,
  helm: Shield,
  moon: Moon,
  rune: Gem,
  shield: Shield,
  spark: Sparkles
};

export const AVATAR_OPTIONS = CHARACTER_OPTIONS.map((character) => ({
  ...character,
  label: character.nameKey,
  icon: fallbackIcons[character.fallbackIcon as keyof typeof fallbackIcons] ?? Sparkles
}));

export type AvatarId = (typeof AVATAR_OPTIONS)[number]["id"];

export { getCharacterOption as getAvatarOption };
