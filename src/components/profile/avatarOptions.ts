import { Flame, Gem, Shield, Sparkles, Star, Zap } from "lucide-react";

export const AVATAR_OPTIONS = [
  {
    id: "default",
    label: "Spark",
    icon: Sparkles,
    gradient:
      "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 54%, #ffffff))"
  },
  {
    id: "flame",
    label: "Streak",
    icon: Flame,
    gradient: "linear-gradient(135deg, #F43F5E, #F59E0B)"
  },
  {
    id: "bolt",
    label: "Power",
    icon: Zap,
    gradient: "linear-gradient(135deg, var(--accent), #22C55E)"
  },
  {
    id: "shield",
    label: "Steady",
    icon: Shield,
    gradient: "linear-gradient(135deg, #0F172A, var(--accent))"
  },
  {
    id: "star",
    label: "Record",
    icon: Star,
    gradient: "linear-gradient(135deg, #7C3AED, var(--accent))"
  },
  {
    id: "gem",
    label: "Focus",
    icon: Gem,
    gradient: "linear-gradient(135deg, #0891B2, var(--accent))"
  }
] as const;

export type AvatarId = (typeof AVATAR_OPTIONS)[number]["id"];

export const getAvatarOption = (avatarId: string) =>
  AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId) ?? AVATAR_OPTIONS[0];
