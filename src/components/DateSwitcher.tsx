import { formatDateTr } from "../lib/dates";

interface Props {
  dateKey: string;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function DateSwitcher({ dateKey, isToday, onPrev, onNext, onToday }: Props) {
  return (
    <div className="row between">
      <button type="button" className="btn-icon" onClick={onPrev} aria-label="Önceki gün">
        ‹
      </button>
      <button type="button" className="btn-text" onClick={onToday} disabled={isToday} style={{ textDecoration: "none", opacity: 1 }}>
        <strong>{isToday ? "Bugün" : formatDateTr(dateKey)}</strong>
      </button>
      <button type="button" className="btn-icon" onClick={onNext} disabled={isToday} aria-label="Sonraki gün">
        ›
      </button>
    </div>
  );
}
