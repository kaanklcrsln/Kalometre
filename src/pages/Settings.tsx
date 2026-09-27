import { Link } from "react-router";
import { AccountCard } from "../components/AccountCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { LegalCard } from "../components/LegalCard";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { useSession } from "../hooks/session";
import { useSettings } from "../hooks/useSettings";
import { MEAL_LABELS, MEALS } from "../lib/calculations";
import { formatDateTr } from "../lib/dates";

export default function Settings() {
  const { uid, userDoc } = useSession();
  const s = useSettings(uid, userDoc);
  const { profile } = userDoc;
  const isAdmin = useIsAdmin(uid);

  return (
    <main className="stack-lg fade-in">
      <h2>Ayarlar</h2>

      <AccountCard username={profile.username} />

      <FeedbackCard uid={uid} username={profile.username} name={profile.name} />

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void s.saveName();
        }}
      >
        <label className="field">
          <span>Adın</span>
          <input className="input" value={s.name} maxLength={24} onChange={(e) => s.setName(e.target.value)} />
        </label>
        {s.nameChanged && (
          <button type="submit" className="btn" disabled={s.busy}>
            Kaydet
          </button>
        )}
        {s.message && <p className={s.message.kind === "ok" ? "note" : "alert"}>{s.message.text}</p>}
      </form>

      {s.goal && (
        <section className="card stack">
          <div className="row between">
            <h3>Planın</h3>
            {s.locked ? (
              <span className="tag negative">Kilitli · {s.lockDaysLeft} gün</span>
            ) : (
              <span className="tag positive">Açık</span>
            )}
          </div>
          <div className="row between">
            <span className="muted">Günlük kalori</span>
            <strong>{s.goal.dailyCalories} kcal</strong>
          </div>
          {MEALS.map((m) => (
            <div key={m} className="row between">
              <span className="muted">{MEAL_LABELS[m]}</span>
              <span>{s.goal!.mealCalories[m]} kcal</span>
            </div>
          ))}
          <div className="row between">
            <span className="muted">Hedef</span>
            <span>
              {s.goal.targetWeightKg} kg · {formatDateTr(s.goal.targetDate)}
            </span>
          </div>
          {s.locked ? (
            <p className="small muted">
              Plan {formatDateTr(s.goal.lockedUntil)} tarihine kadar değiştirilemez. Sözünü tut, {profile.name}.
            </p>
          ) : (
            <Link to="/replan" className="btn btn-positive" style={{ textAlign: "center", textDecoration: "none" }}>
              Yeni plan oluştur
            </Link>
          )}
        </section>
      )}

      <Link to="/weight" className="card row between" style={{ color: "inherit", textDecoration: "none" }}>
        <span>Kilo takibi</span>
        <span aria-hidden>›</span>
      </Link>

      {isAdmin === true && (
        <Link to="/admin" className="card row between" style={{ color: "inherit", textDecoration: "none" }}>
          <span>Yönetici paneli</span>
          <span aria-hidden>›</span>
        </Link>
      )}

      <LegalCard />

      <button type="button" className="btn btn-ghost" onClick={s.signOut}>
        Çıkış yap
      </button>
    </main>
  );
}
