import { useState } from "react";
import { MAX_ITEM_KCAL, MAX_ITEM_NAME } from "../lib/calculations";

interface Props {
  defaultName: string;
  nameLabel: string;
  onSubmit: (name: string, kcal: number) => void;
  onCancel: () => void;
}

export function ManualEntryForm({ defaultName, nameLabel, onSubmit, onCancel }: Props) {
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
            autoFocus
          />
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
