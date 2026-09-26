import { useState } from "react";

interface Props {
  loading: boolean;
  onSave: (ml: number) => void;
}

export function WaterForm({ loading, onSave }: Props) {
  const [custom, setCustom] = useState("");
  return (
    <section className="stack">
      <div className="segmented">
        <button type="button" className="btn" disabled={loading} onClick={() => onSave(250)}>
          250 ml
        </button>
        <button type="button" className="btn" disabled={loading} onClick={() => onSave(500)}>
          500 ml
        </button>
      </div>
      <form
        className="row"
        style={{ flexWrap: "nowrap" }}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(Number(custom));
        }}
      >
        <div className="unit-input grow">
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            placeholder="Özel miktar"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <em>ml</em>
        </div>
        <button type="submit" className="btn btn-ghost" disabled={loading || !custom}>
          Ekle
        </button>
      </form>
    </section>
  );
}
