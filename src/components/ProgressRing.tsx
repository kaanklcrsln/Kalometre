import { alpha, COLORS } from "../config/theme";

interface Props {
  label: string;
  consumed: number;
  target: number;
  size?: number;
}

/** Yeşil: hedef içinde · kırmızı: hedef aşıldı. */
export function ProgressRing({ label, consumed, target, size = 100 }: Props) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;
  const over = target > 0 && consumed > target;
  return (
    <figure className="ring">
      <svg width={size} height={size} role="img" aria-label={`${label}: ${consumed} / ${target} kcal`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={alpha(COLORS.coffee, 0.1)} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? COLORS.brick : COLORS.teal}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill={over ? COLORS.brick : COLORS.coffee}>
          {consumed}
        </text>
        <text x="50%" y="64%" textAnchor="middle" dominantBaseline="central" fontSize={11} fill={alpha(COLORS.coffee, 0.6)}>
          / {target}
        </text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
