interface Props {
  waterMl: number;
  onAdd: (ml: number) => void;
}

export function WaterCounter({ waterMl, onAdd }: Props) {
  return (
    <section className="card row between">
      <div>
        <p className="tag">Su</p>
        <p style={{ fontSize: 22, fontWeight: 700 }}>
          {(waterMl / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} L
        </p>
      </div>
      <div className="row">
        <button type="button" className="btn-icon" onClick={() => onAdd(-250)} disabled={waterMl <= 0} aria-label="250 ml çıkar">
          −
        </button>
        <button type="button" className="btn" style={{ padding: "10px 16px" }} onClick={() => onAdd(250)}>
          +250 ml
        </button>
      </div>
    </section>
  );
}
