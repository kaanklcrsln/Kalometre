import { useEntryEditor } from "../hooks/useEntryEditor";
import type { Entry, NewEntry } from "../types";
import { MealButtons } from "./MealButtons";

interface Props {
  entry: Entry;
  onSave: (patch: Partial<NewEntry>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function EntryEditor({ entry, onSave, onDelete, onClose }: Props) {
  const e = useEntryEditor(
    entry,
    async (patch) => {
      await onSave(patch);
      onClose();
    },
    async () => {
      await onDelete();
      onClose();
    },
  );

  return (
    <div className="card stack fade-in">
      {entry.rawText && <p className="small muted">“{entry.rawText}”</p>}
      {e.items.map((item, i) => (
        <label key={i} className="row" style={{ flexWrap: "nowrap" }}>
          <span className="grow">
            {item.name} {item.amount && <span className="muted small">({item.amount})</span>}
          </span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            value={item.kcal}
            onChange={(ev) => e.setItemKcal(i, ev.target.valueAsNumber)}
            style={{ width: 88, textAlign: "right" }}
          />
          <span className="small muted">kcal</span>
        </label>
      ))}
      <strong>Toplam: {e.total} kcal</strong>
      <MealButtons value={e.meal} onChange={e.setMeal} />
      {e.error && <p className="alert">{e.error}</p>}
      <div className="row between">
        <button
          type="button"
          className="btn btn-negative"
          onClick={() => {
            if (confirm("Bu kayıt silinsin mi?")) void e.remove();
          }}
          disabled={e.busy}
        >
          Sil
        </button>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={e.busy}>
            Vazgeç
          </button>
          <button type="button" className="btn btn-positive" onClick={e.save} disabled={e.busy}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
