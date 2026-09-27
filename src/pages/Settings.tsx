import { useState } from "react";
import { Link } from "react-router";
import { AccountCard } from "../components/AccountCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { GoalEditor } from "../components/GoalEditor";
import { UsersIcon } from "../components/Icons";
import { LegalCard } from "../components/LegalCard";
import { UsersPanel } from "../components/UsersPanel";
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
  const [usersOpen, setUsersOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  return (
    <main className="stack-lg fade-in">
      <div className="row between">
        <h2>Ayarlar</h2>
        {isAdmin === true && (
          <button type="button" className="btn-icon" onClick={() => setUsersOpen(true)} aria-label="Kullanıcılar (yönetici)" title="Kullanıcılar">
            <UsersIcon />
          </button>
        )}
      </div>
      {usersOpen && <UsersPanel adminUid={uid} onClose={() => setUsersOpen(false)} />}
      {goalOpen && s.goal && <GoalEditor uid={uid} profile={profile} goal={s.goal} onClose={() => setGoalOpen(false)} />}

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
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGoalOpen(true)}>
              Kaloriyi düzenle
            </button>
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
              Hedef kilon {formatDateTr(s.goal.lockedUntil)} tarihine kadar ({s.lockDaysLeft} gün) sabit; yeni plan o zaman
              oluşturulabilir. Günlük kalorini ve öğünlerini istediğin zaman değiştirebilirsin.
            </p>
          ) : (
            <Link to="/replan" className="btn btn-positive" style={{ textAlign: "center", textDecoration: "none" }}>
              Yeni plan oluştur
            </Link>
          )}
        </section>
      )}

      <AccountCard username={profile.username} />

      <FeedbackCard uid={uid} username={profile.username} name={profile.name} />

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
