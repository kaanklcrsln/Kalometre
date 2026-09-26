import { useState } from "react";

interface Props {
  defaultName: string;
  onSubmit: (name: string, kcal: number) => void;
  onCancel: () => void;
}

export function ManualEntryForm({ defaultName, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(defaultName);
  const [kcal, setKcal] = useState("");

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name, Number(kcal));
      }}
    >
      <label className="field">
        <span>Ne yedin?</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </label>
      <label className="field">
        <span>Kalori</span>
        <div className="unit-input">
          <input className="input" type="number" inputMode="numeric" min={1} value={kcal} onChange={(e) => setKcal(e.target.value)} required />
          <em>kcal</em>
        </div>
      </label>
      <div className="segmented">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Geri
        </button>
        <button type="submit" className="btn">
          Devam
        </button>
      </div>
    </form>
  );
}
