import { Check, Lock, Swords } from "lucide-react";
import { useId } from "react";
import type { EnemyVisual, RealmVisual, VisualState } from "../../data/assetMap";
import { resolveRealmVisual } from "../../data/assetMap";
import { getCharacterOption } from "../../data/characters";
import { cn } from "../../utils/classNames";

type VisualSize = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<VisualSize, string> = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28 md:h-36 md:w-36"
};

interface CharacterPortraitProps {
  characterId: string;
  size?: VisualSize;
  className?: string | undefined;
  animated?: boolean;
}

export function CharacterPortrait({
  characterId,
  size = "lg",
  className,
  animated = false
}: CharacterPortraitProps) {
  const character = getCharacterOption(characterId);
  const gradientId = useScopedId("hero");
  const glowId = useScopedId("hero-glow");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "character-portrait relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        sizeClass[size],
        animated && "battle-portrait-idle",
        className
      )}
      style={{ color: character.themeColor }}
    >
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 120 120">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="35%" stopColor={character.themeColor} stopOpacity="0.78" />
            <stop offset="100%" stopColor="#050816" />
          </radialGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.12 0 0 0 0 0.28 0 0 0 0 0.95 0 0 0 .72 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" fill={`url(#${gradientId})`} r="58" />
        <path d="M25 96C31 74 41 61 60 61C79 61 89 74 95 96Z" fill="#050816" opacity="0.86" />
        <path d="M42 61L34 38L47 46L60 21L73 46L86 38L78 61Z" fill="#0F172A" />
        <path
          d="M43 59C46 43 51 35 60 35C69 35 74 43 77 59C73 68 67 73 60 73C53 73 47 68 43 59Z"
          fill="#111827"
        />
        <path
          d="M47 57L57 54M73 57L63 54"
          filter={`url(#${glowId})`}
          stroke={character.themeColor}
          strokeLinecap="round"
          strokeWidth="4"
        />
        <path
          d={getCharacterMark(character.portraitKey)}
          fill="none"
          stroke="#F8FAFC"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.85"
          strokeWidth="4"
        />
      </svg>
    </span>
  );
}

interface MonsterIconProps {
  visual: EnemyVisual;
  state?: VisualState | undefined;
  size?: VisualSize;
  className?: string | undefined;
  animated?: boolean;
}

export function MonsterIcon({
  visual,
  state = "available",
  size = "md",
  className,
  animated = false
}: MonsterIconProps) {
  const gradientId = useScopedId("monster");
  const glowId = useScopedId("monster-glow");
  const isLocked = state === "locked";
  const isDefeated = state === "defeated" || state === "opened" || state === "completed";
  const color = isLocked ? "var(--text-muted)" : visual.themeColor;
  const badge = getStateBadge(state);

  return (
    <span
      className={cn(
        "fantasy-icon relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl",
        sizeClass[size],
        isLocked && "opacity-55 grayscale",
        isDefeated && "ring-1 ring-[var(--success)]",
        animated && "battle-portrait-idle",
        className
      )}
      style={{ color }}
    >
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 120 120">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.88" />
            <stop offset="38%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#030712" />
          </radialGradient>
          <filter id={glowId} x="-28%" y="-28%" width="156%" height="156%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect fill="#030712" height="120" rx="28" width="120" />
        <circle cx="60" cy="58" fill={`url(#${gradientId})`} opacity="0.34" r="48" />
        {visual.type === "chest" ? renderChest(color) : renderMonsterShape(visual, color, glowId)}
      </svg>
      {badge ? (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface)] text-[0.65rem] shadow-sm">
          {badge}
        </span>
      ) : null}
    </span>
  );
}

export function BossIcon(props: MonsterIconProps) {
  return <MonsterIcon {...props} />;
}

interface RealmBannerProps {
  realmId: string;
  title: string;
  state?: VisualState | undefined;
  compact?: boolean;
  className?: string | undefined;
}

export function RealmBanner({
  realmId,
  title,
  state = "available",
  compact = false,
  className
}: RealmBannerProps) {
  const visual = resolveRealmVisual(realmId);
  const isLocked = state === "locked";

  return (
    <div
      aria-label={title}
      className={cn(
        "realm-banner relative overflow-hidden rounded-[1.35rem] border border-[var(--border-soft)]",
        compact ? "h-28" : "h-44",
        isLocked && "opacity-60 grayscale",
        className
      )}
      role="img"
      style={{ background: visual.backgroundGradient }}
    >
      <RealmIllustration visual={visual} locked={isLocked} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/34 px-2 py-1 text-xs font-black text-white backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: visual.themeColor }} />
        {getRealmStateIcon(state)}
      </div>
    </div>
  );
}

interface BattleBackdropProps {
  realmId: string;
  className?: string | undefined;
}

export function BattleBackdrop({ realmId, className }: BattleBackdropProps) {
  const visual = resolveRealmVisual(realmId);
  return (
    <div
      aria-hidden="true"
      className={cn("battle-backdrop absolute inset-0", className)}
      style={{ background: visual.backgroundGradient }}
    >
      <RealmIllustration visual={visual} locked={false} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,transparent,rgba(0,0,0,.55)_72%)]" />
    </div>
  );
}

function RealmIllustration({ visual, locked }: { visual: RealmVisual; locked: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 600 240"
    >
      <path
        d="M0 208C90 180 132 192 208 168C286 143 358 153 438 126C506 103 550 85 600 92V240H0Z"
        fill="#020617"
        opacity="0.64"
      />
      <path d="M62 214L118 120L166 214Z" fill="#0F172A" opacity="0.62" />
      <path d="M402 216L480 82L554 216Z" fill="#111827" opacity="0.72" />
      <path
        d={getRealmPath(visual.realmImageKey)}
        fill="none"
        opacity={locked ? "0.45" : "0.9"}
        stroke={visual.themeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path
        d="M118 218C205 192 304 190 482 218"
        fill="none"
        stroke="#F8FAFC"
        strokeOpacity="0.08"
        strokeWidth="8"
      />
      <circle cx="500" cy="56" fill={visual.themeColor} opacity="0.24" r="34" />
    </svg>
  );
}

const renderMonsterShape = (visual: EnemyVisual, color: string, glowId: string) => {
  if (visual.type === "boss" || visual.type === "realmBoss") {
    return (
      <g filter={`url(#${glowId})`}>
        <path
          d="M24 97L33 45L48 28L60 46L72 28L87 45L96 97Z"
          fill="#09090B"
          stroke={color}
          strokeWidth="5"
        />
        <path
          d="M37 50L26 24L50 38M83 50L94 24L70 38"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="6"
        />
        <path d="M43 66L55 62M77 66L65 62" stroke="#F8FAFC" strokeLinecap="round" strokeWidth="5" />
        <path d="M49 86H71" stroke={color} strokeLinecap="round" strokeWidth="5" />
      </g>
    );
  }
  if (visual.iconKey.includes("spider") || visual.iconKey.includes("crawler")) {
    return (
      <g filter={`url(#${glowId})`}>
        <ellipse cx="60" cy="70" fill="#080B12" rx="30" ry="23" stroke={color} strokeWidth="5" />
        <circle cx="60" cy="48" fill="#080B12" r="18" stroke={color} strokeWidth="5" />
        <path
          d="M31 65L12 54M34 78L14 88M89 65L108 54M86 78L106 88M45 86L34 108M75 86L86 108"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path d="M52 47L58 45M68 47L62 45" stroke="#F8FAFC" strokeLinecap="round" strokeWidth="4" />
      </g>
    );
  }
  if (visual.iconKey.includes("wraith") || visual.iconKey.includes("reaper")) {
    return (
      <g filter={`url(#${glowId})`}>
        <path
          d="M31 95C33 54 42 30 60 30C78 30 87 54 89 95L76 86L68 103L59 88L49 103L42 86Z"
          fill="#080B12"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path d="M47 59L56 55M73 59L64 55" stroke="#F8FAFC" strokeLinecap="round" strokeWidth="5" />
        <path
          d="M84 42C96 40 103 35 108 25"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="5"
        />
      </g>
    );
  }
  if (
    visual.iconKey.includes("knight") ||
    visual.iconKey.includes("brute") ||
    visual.type === "elite"
  ) {
    return (
      <g filter={`url(#${glowId})`}>
        <path
          d="M32 98L38 41L60 25L82 41L88 98Z"
          fill="#080B12"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path
          d="M43 47H77L70 72H50Z"
          fill="#111827"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path d="M47 55L56 53M73 55L64 53" stroke="#F8FAFC" strokeLinecap="round" strokeWidth="4" />
        <path d="M31 52L17 36M89 52L103 36" stroke={color} strokeLinecap="round" strokeWidth="5" />
      </g>
    );
  }
  return (
    <g filter={`url(#${glowId})`}>
      <path
        d="M30 85C30 50 43 34 60 34C77 34 90 50 90 85C90 97 78 104 60 104C42 104 30 97 30 85Z"
        fill="#080B12"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path d="M38 49L27 27M82 49L93 27" stroke={color} strokeLinecap="round" strokeWidth="5" />
      <path d="M47 65L56 61M73 65L64 61" stroke="#F8FAFC" strokeLinecap="round" strokeWidth="5" />
      <path
        d="M50 86C56 90 64 90 70 86"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="4"
      />
    </g>
  );
};

const renderChest = (color: string) => (
  <g>
    <path
      d="M28 54H92V96H28Z"
      fill="#111827"
      stroke={color}
      strokeLinejoin="round"
      strokeWidth="5"
    />
    <path
      d="M32 54C36 36 46 27 60 27C74 27 84 36 88 54Z"
      fill="#080B12"
      stroke={color}
      strokeLinejoin="round"
      strokeWidth="5"
    />
    <path d="M28 68H92M60 54V96" stroke="#F59E0B" strokeWidth="5" />
    <rect fill="#F59E0B" height="15" rx="3" width="14" x="53" y="65" />
  </g>
);

const getStateBadge = (state: VisualState) => {
  if (state === "locked") {
    return <Lock aria-hidden="true" size={12} />;
  }
  if (state === "defeated" || state === "opened" || state === "completed") {
    return <Check aria-hidden="true" size={12} className="text-[var(--success)]" />;
  }
  if (state === "active" || state === "selected") {
    return <Swords aria-hidden="true" size={12} className="text-[var(--accent)]" />;
  }
  return null;
};

const getRealmStateIcon = (state: VisualState) => {
  if (state === "locked") {
    return <Lock aria-hidden="true" size={12} />;
  }
  if (state === "completed") {
    return <Check aria-hidden="true" size={12} />;
  }
  return <Swords aria-hidden="true" size={12} />;
};

const getRealmPath = (key: string) => {
  if (key.includes("citadel")) {
    return "M258 198V91L301 45L344 91V198M220 198V120L258 91M382 198V120L344 91M282 198V135H320V198";
  }
  if (key.includes("frost")) {
    return "M205 198L248 84L286 198M286 198L326 52L389 198M235 150H360";
  }
  if (key.includes("red")) {
    return "M210 198L238 70H362L390 198M262 198V112H338V198M238 70L300 34L362 70";
  }
  if (key.includes("spider")) {
    return "M205 198C224 96 267 58 301 58C335 58 376 96 395 198M250 118L206 84M350 118L394 84M246 152L196 164M354 152L404 164";
  }
  if (key.includes("goblin")) {
    return "M210 198L248 102H352L390 198M254 102L300 55L346 102M270 198V138H330V198";
  }
  return "M218 198V90C218 65 244 44 300 44C356 44 382 65 382 90V198M257 198V112C257 93 273 80 300 80C327 80 343 93 343 112V198";
};

const getCharacterMark = (portraitKey: string) => {
  if (portraitKey.includes("crimson")) {
    return "M60 82L76 98M60 82L44 98M60 78V101";
  }
  if (portraitKey.includes("frost") || portraitKey.includes("moon")) {
    return "M45 87C55 96 71 96 82 84";
  }
  if (portraitKey.includes("iron") || portraitKey.includes("void")) {
    return "M45 83H75M49 96H71";
  }
  if (portraitKey.includes("arcane")) {
    return "M60 82L72 94L60 106L48 94Z";
  }
  if (portraitKey.includes("silent")) {
    return "M48 92L72 84M52 102L76 94";
  }
  if (portraitKey.includes("storm")) {
    return "M64 80L52 98H64L58 110";
  }
  return "M48 88C55 94 65 94 72 88";
};

const useScopedId = (prefix: string) => `${prefix}-${useId().replace(/:/g, "")}`;
