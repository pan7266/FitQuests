import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatDuration } from "../../utils/dates";
import type { ChartDatum } from "../../utils/stats";

interface StatsChartProps {
  data: ChartDatum[];
  valueLabel: string;
}

const formatChartValue = (value: number, valueLabel: string) => {
  if (valueLabel === "time") {
    return formatDuration(value);
  }
  if (valueLabel === "km") {
    return `${value.toFixed(2)} km`;
  }
  if (valueLabel === "workouts") {
    return `${value} workouts`;
  }
  if (valueLabel === "XP") {
    return `${value} XP`;
  }

  return `${value} ${valueLabel}`;
};

export function StatsChart({ data, valueLabel }: StatsChartProps) {
  return (
    <div aria-label={`${valueLabel} bar chart`} className="h-56 w-full" role="img">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-soft)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={(value: number) =>
              valueLabel === "time"
                ? formatDuration(value)
                : valueLabel === "km"
                  ? value.toFixed(1)
                  : String(value)
            }
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip valueLabel={valueLabel} />}
            cursor={{ fill: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
          />
          <Bar dataKey="value" fill="var(--accent)" name={valueLabel} radius={[8, 8, 4, 4]}>
            <LabelList
              dataKey="value"
              fill="var(--accent-contrast)"
              fontSize={11}
              formatter={(value) => {
                const numericValue = Number(value);
                return valueLabel === "time"
                  ? formatDuration(numericValue)
                  : valueLabel === "km"
                    ? `${numericValue.toFixed(1)} km`
                    : String(numericValue);
              }}
              position="insideTop"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  valueLabel
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: ChartDatum }>;
  valueLabel: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const datum = item.payload;
  const numericValue = Number(item.value ?? datum?.value ?? 0);
  const title = datum?.title ?? datum?.label ?? "Workout";

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-inset)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <p className="text-app text-sm font-black">
        {title} | {formatChartValue(numericValue, valueLabel)}
      </p>
      {datum?.subtitle ? <p className="text-app-muted mt-1 text-xs">{datum.subtitle}</p> : null}
    </div>
  );
}
