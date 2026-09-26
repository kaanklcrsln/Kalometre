import { useNavigate } from "react-router";
import { WeightChart } from "../components/WeightChart";
import { useSession } from "../hooks/session";
import { useWeightPage } from "../hooks/useWeightPage";
import { formatDateTr, todayKey } from "../lib/dates";
import { formatKg } from "../lib/numbers";

export default function Weight() {
  const { uid, userDoc } = useSession();
  const name = userDoc.profile.name;
  const w = useWeightPage(uid, userDoc);
  const navigate = useNavigate();

  return (
    <main className="stack-lg fade-in">
      <div className="row">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)} aria-label="Geri">
          ‹
        </button>
        <h2>Kilo takibi</h2>
      </div>

      {w.goal && w.latest && (
        <section className="card stack">
          <div className="row between">
            <span className="muted">Şu an</span>
            <strong style={{ fontSize: 22 }}>{formatKg(w.latest.weightKg)} kg</strong>
          </div>
          <div className="row between">
            <span className="muted">Hedef</span>
            <span>
              {formatKg(w.goal.targetWeightKg)} kg · {formatDateTr(w.goal.targetDate)}
            </span>
          </div>
          {w.lostKg !== 0 && (
            <p className={w.lostKg > 0 ? "positive" : "negative"} style={{ fontWeight: 600 }}>
              {w.lostKg > 0 ? `Başladığından beri ${formatKg(w.lostKg)} kg verdin, ${name}!` : `Başladığından beri ${formatKg(-w.lostKg)} kg aldın.`}
            </p>
          )}
        </section>
      )}

      {w.loading ? <div className="spinner" style={{ margin: "0 auto" }} /> : <WeightChart weights={w.weights} planLine={w.planPoints} />}

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void w.save();
        }}
      >
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input className="input" type="date" max={todayKey()} value={w.date} onChange={(e) => w.setDate(e.target.value)} style={{ flex: 1.3 }} />
          <div className="unit-input" style={{ flex: 1 }}>
            <input className="input" inputMode="decimal" placeholder="Kilo" value={w.input} onChange={(e) => w.setInput(e.target.value)} />
            <em>kg</em>
          </div>
        </div>
        <button type="submit" className="btn" disabled={w.busy || !w.input}>
          Kaydet
        </button>
        <small className="muted">Aynı güne ikinci kez girersen önceki kaydın üzerine yazılır. Kalori hedefin plan bitene kadar değişmez.</small>
      </form>

      {w.error && (
        <p className="alert" role="alert">
          {w.error}
        </p>
      )}

      <details>
        <summary>Kayıtlar ({w.weights.length})</summary>
        <table className="list-table">
          <tbody>
            {[...w.weights].reverse().map((entry) => (
              <tr key={entry.date}>
                <td>{formatDateTr(entry.date)}</td>
                <td className="num">
                  <strong>{formatKg(entry.weightKg)} kg</strong>
                </td>
                <td className="num">
                  <button
                    type="button"
                    className="btn-text negative small"
                    disabled={w.busy}
                    onClick={() => {
                      if (confirm("Bu kilo kaydı silinsin mi?")) void w.remove(entry.date);
                    }}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </main>
  );
}
