import type { Activity } from "../../db/schema";

interface ExerciseIllustrationProps {
  activity: Activity;
}

export function ExerciseIllustration({ activity }: ExerciseIllustrationProps) {
  const pose = getPose(activity);
  const accent = "var(--accent)";
  const glow = "drop-shadow(0 0 8px var(--accent))";

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 240 180"
    >
      <defs>
        <radialGradient id={`exercise-glow-${activity.id}`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,.24)" />
          <stop offset="46%" stopColor="rgba(37,99,235,.12)" />
          <stop offset="100%" stopColor="rgba(2,6,23,.94)" />
        </radialGradient>
        <linearGradient id={`exercise-floor-${activity.id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,.16)" />
          <stop offset="100%" stopColor="rgba(255,255,255,.02)" />
        </linearGradient>
      </defs>
      <rect fill={`url(#exercise-glow-${activity.id})`} height="180" rx="24" width="240" />
      <path
        d="M24 134 C62 114 100 148 141 126 C174 109 196 116 224 132 L224 180 L24 180 Z"
        fill={`url(#exercise-floor-${activity.id})`}
      />
      <g filter="drop-shadow(0 10px 18px rgba(0,0,0,.42))" strokeLinecap="round">
        {pose === "pull" ? <PullupFigure accent={accent} glow={glow} /> : null}
        {pose === "push" ? <PushupFigure accent={accent} glow={glow} /> : null}
        {pose === "sit" ? <SitupFigure accent={accent} glow={glow} /> : null}
        {pose === "squat" ? <SquatFigure accent={accent} glow={glow} /> : null}
        {pose === "run" ? <TreadmillFigure accent={accent} glow={glow} /> : null}
        {pose === "timed" ? <PlankFigure accent={accent} glow={glow} /> : null}
        {pose === "weight" ? <WeightFigure accent={accent} glow={glow} /> : null}
        {pose === "generic" ? <GenericFigure accent={accent} glow={glow} /> : null}
      </g>
    </svg>
  );
}

function getPose(activity: Activity) {
  if (activity.slug.includes("pull")) {
    return "pull";
  }
  if (activity.slug.includes("push")) {
    return "push";
  }
  if (activity.slug.includes("sit")) {
    return "sit";
  }
  if (activity.slug.includes("squat")) {
    return "squat";
  }
  if (activity.slug.includes("treadmill") || activity.slug.includes("run")) {
    return "run";
  }
  if (activity.unit === "seconds") {
    return "timed";
  }
  if (activity.unit === "weight") {
    return "weight";
  }
  return "generic";
}

function Head({ cx = 120, cy = 55 }: { cx?: number; cy?: number }) {
  return (
    <circle cx={cx} cy={cy} fill="#f8fafc" r="13" stroke="rgba(15,23,42,.72)" strokeWidth="4" />
  );
}

function PullupFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <path d="M64 38 H176" stroke="#f8fafc" strokeWidth="8" />
      <path d="M78 38 V132 M162 38 V132" stroke="rgba(148,163,184,.56)" strokeWidth="5" />
      <Head />
      <path d="M120 69 V112" stroke="#f8fafc" strokeWidth="12" />
      <path
        d="M116 80 C100 70 92 56 84 40 M124 80 C140 70 148 56 156 40"
        stroke="#f8fafc"
        strokeWidth="10"
      />
      <path d="M118 112 L96 146 M122 112 L146 146" stroke="#f8fafc" strokeWidth="10" />
      <path
        d="M104 76 C114 88 126 88 136 76"
        stroke={accent}
        strokeWidth="7"
        style={{ filter: glow }}
      />
    </>
  );
}

function PushupFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <Head cx={74} cy={97} />
      <path d="M88 101 L151 89 L190 109" stroke="#f8fafc" strokeWidth="13" />
      <path d="M108 96 L100 134 M150 91 L158 134" stroke="#f8fafc" strokeWidth="10" />
      <path d="M187 109 L213 134 M190 109 L214 116" stroke="#f8fafc" strokeWidth="9" />
      <path d="M110 96 L145 90" stroke={accent} strokeWidth="8" style={{ filter: glow }} />
      <path d="M49 139 H211" stroke="rgba(148,163,184,.5)" strokeWidth="5" />
    </>
  );
}

function SitupFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <path d="M50 142 H202" stroke="rgba(148,163,184,.5)" strokeWidth="5" />
      <Head cx={95} cy={81} />
      <path d="M106 93 C126 110 140 124 155 142" stroke="#f8fafc" strokeWidth="13" />
      <path d="M151 141 C166 121 184 119 203 139" stroke="#f8fafc" strokeWidth="10" />
      <path d="M103 90 C89 99 78 110 69 126" stroke="#f8fafc" strokeWidth="9" />
      <path
        d="M116 101 C126 111 135 121 145 133"
        stroke={accent}
        strokeWidth="8"
        style={{ filter: glow }}
      />
    </>
  );
}

function SquatFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <Head cx={120} cy={49} />
      <path d="M120 62 L120 105" stroke="#f8fafc" strokeWidth="13" />
      <path d="M118 75 L88 103 M122 75 L154 102" stroke="#f8fafc" strokeWidth="9" />
      <path
        d="M118 104 L91 132 L64 132 M122 104 L154 132 L184 132"
        stroke="#f8fafc"
        strokeWidth="11"
      />
      <path d="M91 132 H64 M154 132 H184" stroke="#f8fafc" strokeWidth="10" />
      <path
        d="M111 103 L91 130 M129 103 L154 130"
        stroke={accent}
        strokeWidth="8"
        style={{ filter: glow }}
      />
    </>
  );
}

function TreadmillFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <path d="M48 140 H192 L210 124" stroke="rgba(148,163,184,.64)" strokeWidth="8" />
      <path d="M72 132 H174" stroke={accent} strokeWidth="7" style={{ filter: glow }} />
      <Head cx={112} cy={51} />
      <path d="M112 64 L126 100" stroke="#f8fafc" strokeWidth="12" />
      <path d="M122 80 L93 100 M128 82 L158 69" stroke="#f8fafc" strokeWidth="9" />
      <path d="M126 100 L99 128 M127 101 L157 125" stroke="#f8fafc" strokeWidth="10" />
      <path d="M94 129 L70 124 M157 125 L181 134" stroke="#f8fafc" strokeWidth="8" />
    </>
  );
}

function PlankFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <Head cx={67} cy={98} />
      <path d="M82 100 L153 98 L200 119" stroke="#f8fafc" strokeWidth="13" />
      <path d="M103 99 L85 132 M152 99 L160 132" stroke="#f8fafc" strokeWidth="10" />
      <path d="M196 119 L215 132" stroke="#f8fafc" strokeWidth="9" />
      <path d="M94 100 L153 98" stroke={accent} strokeWidth="8" style={{ filter: glow }} />
      <path d="M48 138 H216" stroke="rgba(148,163,184,.5)" strokeWidth="5" />
    </>
  );
}

function WeightFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <path d="M70 76 H170" stroke="rgba(148,163,184,.62)" strokeWidth="7" />
      <path d="M56 62 V90 M184 62 V90" stroke={accent} strokeWidth="12" style={{ filter: glow }} />
      <Head cx={120} cy={59} />
      <path d="M120 73 V120" stroke="#f8fafc" strokeWidth="13" />
      <path d="M117 82 L84 76 M123 82 L156 76" stroke="#f8fafc" strokeWidth="10" />
      <path d="M118 120 L95 148 M122 120 L145 148" stroke="#f8fafc" strokeWidth="10" />
    </>
  );
}

function GenericFigure({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <Head />
      <path d="M120 69 V116" stroke="#f8fafc" strokeWidth="13" />
      <path d="M118 83 L87 108 M122 83 L153 108" stroke="#f8fafc" strokeWidth="9" />
      <path d="M118 116 L92 148 M122 116 L148 148" stroke="#f8fafc" strokeWidth="10" />
      <path d="M110 93 H130" stroke={accent} strokeWidth="8" style={{ filter: glow }} />
    </>
  );
}
