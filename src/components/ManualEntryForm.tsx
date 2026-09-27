import { useState } from "react";
import { MAX_ITEM_KCAL, MAX_ITEM_NAME } from "../lib/calculations";

interface Props {
  defaultName: string;
  /** Yapay zekânın tahmini (KaloAI'dan eklerken); boşsa kullanıcı girer. */
  defaultKcal?: number;
  nameLabel: string;
  /** Kaydedilirken butonlar kapalı. */
  busy?: boolean;
  onSubmit: (name: string, kcal: number) => void;
  onCancel: () => void;
}

export function ManualEntryForm({ defaultName, defaultKcal, nameLabel, busy = false, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(defaultName);
  const [kcal, setKcal] = useState(defaultKcal ? String(defaultKcal) : "");

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name, Number(kcal));
      }}
    >
      <label className="field">
        <span>{nameLabel}</span>
        <input
          className="input"
          placeholder="İsteğe bağlı"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_ITEM_NAME}
        />
      </label>
      <label className="field">
        <span>Kalori</span>
        <div className="unit-input">
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_ITEM_KCAL}
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            required
            autoFocus={!defaultKcal}
          />
          <em>kcal</em>
        </div>
      </label>
      <div className="segmented">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          Geri
        </button>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Kaydediliyor…" : "Devam"}
        </button>
      </div>
    </form>
  );
}
