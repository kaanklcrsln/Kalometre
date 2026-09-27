import { Navigate, useNavigate } from "react-router";
import { useAdminNotes } from "../hooks/useAdminNotes";
import { useAdminRequests } from "../hooks/useAdminRequests";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { useSession } from "../hooks/session";
import { ADMIN_GRANT_DAYS } from "../lib/entitlement";
import { NOTE_TYPE_LABELS } from "../lib/notes";

const formatTime = (ms: number | null) =>
  ms ? new Date(ms).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "";

/** Admin paneli: Kalo+ onay istekleri ve şikayet/öneri notları. Erişim Firestore kurallarıyla da korunur. */
export default function Admin() {
  const { uid } = useSession();
  const isAdmin = useIsAdmin(uid);
  const navigate = useNavigate();
  const a = useAdminRequests(uid, isAdmin === true);
  const n = useAdminNotes(isAdmin === true);

  // Yetki token yenilenince netleşir; admin değilse ayarlara dön.
  if (isAdmin === false) return <Navigate to="/settings" replace />;

  return (
    <main className="stack-lg fade-in">
      <div className="row">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)} aria-label="Geri">
          ‹
        </button>
        <h2>Yönetici paneli</h2>
      </div>

      <h3>Onay istekleri</h3>
      <p className="muted small">Onaylanan kullanıcıya {ADMIN_GRANT_DAYS} günlük Kalo+ verilir; satın alım gerekmez.</p>

      {a.error && <p className="alert">{a.error}</p>}
      {a.loading ? (
        <div className="spinner" style={{ margin: "0 auto" }} />
      ) : a.requests.length === 0 ? (
        <p className="muted center">Bekleyen istek yok.</p>
      ) : (
        <ul className="entry-list">
          {a.requests.map((r) => (
            <li key={r.uid} className="card stack">
              <div className="row between">
                <strong>{r.name}</strong>
                <span className="small muted">@{r.username}</span>
              </div>
              {r.createdAtMs && <span className="small muted">{formatTime(r.createdAtMs)}</span>}
              <div className="segmented">
                <button type="button" className="btn btn-negative" disabled={a.busyId === r.uid} onClick={() => void a.reject(r.uid)}>
                  Reddet
                </button>
                <button type="button" className="btn btn-positive" disabled={a.busyId === r.uid} onClick={() => void a.approve(r.uid)}>
                  Onayla
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3>Şikayet ve öneriler</h3>
      {n.error && <p className="alert">{n.error}</p>}
      {n.loading ? (
        <div className="spinner" style={{ margin: "0 auto" }} />
      ) : n.notes.length === 0 ? (
        <p className="muted center">Henüz not yok.</p>
      ) : (
        <ul className="entry-list">
          {n.notes.map((note) => (
            <li key={note.id} className="card stack">
              <div className="row between">
                <span className={`tag ${note.type === "complaint" ? "negative" : "positive"}`}>{NOTE_TYPE_LABELS[note.type]}</span>
                <span className="small muted">{formatTime(note.createdAtMs)}</span>
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>{note.text}</p>
              <div className="row between">
                <span className="small muted">
                  {note.name} · @{note.username}
                </span>
                <button
                  type="button"
                  className="btn-text negative small"
                  onClick={() => {
                    if (confirm("Bu not silinsin mi?")) void n.remove(note.id);
                  }}
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
