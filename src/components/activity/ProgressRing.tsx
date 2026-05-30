import { cn } from "../../utils/classNames";

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  max,
  label,
  size = 112,
  stroke = 10,
  color = "var(--accent)",
  children,
  className
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  const dashOffset = circumference - progress * circumference;

  return (
    <div
      aria-label={label}
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true" height={size} width={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="var(--progress-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={stroke}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
