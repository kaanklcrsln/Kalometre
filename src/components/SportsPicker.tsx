import { onTapMood } from "../avatar/moods";
import { SPORTS } from "../config/sports";
import type { SportRow } from "../hooks/useOnboarding";
import type { SportEntry } from "../types";

interface Props {
  rows: SportRow[];
  onAdd: () => void;
  onRemove: (key: number) => void;
  onChange: (key: number, patch: Partial<SportEntry>) => void;
}

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function SportsPicker({ rows, onAdd, onRemove, onChange }: Props) {
  return (
    <div className="stack">
      {rows.length > 0 && (
        <div className="sport-row small muted">
          <span>Spor</span>
          <span>Haftada</span>
          <span />
        </div>
      )}
      {rows.map((row) => (
        <div key={row.key} className="sport-row fade-in">
          <select
            className="select"
            value={row.sportId}
            onChange={(e) => onChange(row.key, { sportId: e.target.value })}
            aria-label="Spor"
          >
            <option value="">Seç…</option>
            {SPORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={row.daysPerWeek}
            onChange={(e) => onChange(row.key, { daysPerWeek: Number(e.target.value) })}
            aria-label="Haftada kaç gün"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d} gün
              </option>
            ))}
          </select>
          <button type="button" className="btn-icon" {...onTapMood("sad")} onClick={() => onRemove(row.key)} aria-label="Sporu kaldır">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost" {...onTapMood("celebrate")} onClick={onAdd}>
        + Spor ekle
      </button>
      {rows.length === 0 && <p className="muted small">Spor yapmıyorsan boş bırakıp devam edebilirsin.</p>}
    </div>
  );
}
