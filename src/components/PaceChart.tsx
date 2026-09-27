import { Area, AreaChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { alpha } from "../config/theme";
import { useTheme } from "../hooks/useTheme";
import { formatDateShort } from "../lib/dates";

interface Props {
  currentKg: number;
  targetKg: number;
  days: number;
  targetDate: string;
}

const STEPS = 12;

/** Bugünden hedefe doğrusal iniş; hız değişince yeniden animasyonla çizilir. */
export function PaceChart({ currentKg, targetKg, days, targetDate }: Props) {
  const { colors: c } = useTheme();
  const data = Array.from({ length: STEPS + 1 }, (_, i) => ({
    day: Math.round((days * i) / STEPS),
    kg: Math.round((currentKg - ((currentKg - targetKg) * i) / STEPS) * 10) / 10,
  }));
  const minKg = Math.floor(targetKg - 2);
  const maxKg = Math.ceil(currentKg + 1);

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <AreaChart key={days} data={data} margin={{ top: 16, right: 16, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="paceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.positive} stopOpacity={0.25} />
              <stop offset="100%" stopColor={c.positive} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, days]}
            ticks={[0, days]}
            tickFormatter={(d) => (d === 0 ? "Bugün" : formatDateShort(targetDate))}
            tick={{ fontSize: 12, fill: alpha(c.ink, 0.7) }}
            stroke={alpha(c.ink, 0.2)}
            tickLine={false}
          />
          <YAxis
            domain={[minKg, maxKg]}
            tick={{ fontSize: 12, fill: alpha(c.ink, 0.7) }}
            stroke="transparent"
            unit=" kg"
            width={60}
          />
          <Area
            type="monotone"
            dataKey="kg"
            stroke={c.positive}
            strokeWidth={3}
            fill="url(#paceFill)"
            isAnimationActive
            animationDuration={1200}
            dot={false}
          />
          <ReferenceDot x={0} y={currentKg} r={5} fill={c.ink} stroke={c.paper} strokeWidth={2} />
          <ReferenceDot x={days} y={targetKg} r={6} fill={c.positive} stroke={c.paper} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
