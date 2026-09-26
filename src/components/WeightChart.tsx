import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { alpha, COLORS } from "../config/theme";
import { fromDateKey } from "../lib/dates";

interface Point {
  date: string;
  weightKg: number;
}

interface Props {
  weights: Point[];
  planLine: Point[];
}

const toChart = (points: Point[]) => points.map((p) => ({ t: fromDateKey(p.date).getTime(), kg: p.weightKg }));

const formatDay = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

const axisTick = { fontSize: 12, fill: alpha(COLORS.coffee, 0.7) };

/** Gerçek kilolar (koyu, noktalı) ve başlangıçtan hedefe plan çizgisi (yeşil, kesikli). */
export function WeightChart({ weights, planLine }: Props) {
  const actual = toChart(weights);
  const plan = toChart(planLine);
  const all = [...actual, ...plan];
  if (all.length === 0) return null;

  const kgs = all.map((p) => p.kg);
  const minKg = Math.floor(Math.min(...kgs) - 1);
  const maxKg = Math.ceil(Math.max(...kgs) + 1);

  // recharts'ın otomatik tick'leri kısa aralıkta aynı günü tekrarlıyor; en fazla 4 benzersiz gün seç.
  const ts = all.map((p) => p.t);
  const [minT, maxT] = [Math.min(...ts), Math.max(...ts)];
  const ticks = [
    ...new Set(
      [0, 1, 2, 3].map((i) => {
        const d = new Date(minT + ((maxT - minT) * i) / 3);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }),
    ),
  ];

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <LineChart margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={alpha(COLORS.coffee, 0.08)} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={formatDay}
            tick={axisTick}
            stroke={alpha(COLORS.coffee, 0.2)}
            tickLine={false}
          />
          <YAxis domain={[minKg, maxKg]} tick={axisTick} stroke="transparent" unit=" kg" width={60} />
          <Tooltip
            labelFormatter={(t) => formatDay(Number(t))}
            formatter={(value) => [`${String(value).replace(".", ",")} kg`]}
            contentStyle={{ background: COLORS.porcelain, border: `1px solid ${alpha(COLORS.coffee, 0.2)}`, borderRadius: 10, color: COLORS.coffee }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} formatter={(value) => <span style={{ color: COLORS.coffee }}>{value}</span>} />
          <Line
            name="Plan"
            data={plan}
            dataKey="kg"
            stroke={COLORS.teal}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Kilon"
            data={actual}
            dataKey="kg"
            stroke={COLORS.coffee}
            strokeWidth={2}
            dot={{ r: 4, fill: COLORS.coffee, stroke: COLORS.porcelain, strokeWidth: 2 }}
            isAnimationActive
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
