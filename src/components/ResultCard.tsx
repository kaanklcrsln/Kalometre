import type { FoodItem } from "../types";

interface Props {
  items: FoodItem[];
  assumptions: string;
  total: number;
  onKcalChange: (index: number, kcal: number) => void;
  onReject: () => void;
  onAccept: () => void;
}

export function ResultCard({ items, assumptions, total, onKcalChange, onReject, onAccept }: Props) {
  return (
    <section className="card stack fade-in">
      <table className="result-table">
        <thead>
          <tr>
            <th>Kalem</th>
            <th className="num">g</th>
            <th className="num">kcal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>
                {item.name}
                {item.amount && (
                  <>
                    <br />
                    <span className="small muted">{item.amount}</span>
                  </>
                )}
              </td>
              <td className="num muted">{item.grams}</td>
              <td className="num">
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={item.kcal}
                  onChange={(e) => onKcalChange(i, e.target.valueAsNumber)}
                  aria-label={`${item.name} kalorisi`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {assumptions && <p className="note small">Varsayım: {assumptions}</p>}
      <div className="row between">
        <span className="muted">Toplam</span>
        <strong style={{ fontSize: 22 }}>{total} kcal</strong>
      </div>
      <div className="segmented">
        <button type="button" className="btn btn-negative" onClick={onReject} aria-label="Reddet ve düzenle">
          ✗ Düzenle
        </button>
        <button type="button" className="btn btn-positive" onClick={onAccept} aria-label="Onayla">
          ✓ Onayla
        </button>
      </div>
    </section>
  );
}
