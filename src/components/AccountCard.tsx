import { useId, useState } from "react";
import { useChangePassword } from "../hooks/useChangePassword";

/**
 * Ayarlar > Hesap (varsayılan kapalı): kilitli kullanıcı adı ve şifre değiştirme.
 * Mevcut şifre hiçbir yerde görünmez (Firebase de saklamaz).
 */
export function AccountCard({ username }: { username: string }) {
  const p = useChangePassword();
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <section className="card stack">
      <button type="button" className="card-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
        <h3>Hesap</h3>
        <span className="card-toggle-icon" aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div id={bodyId} className="stack">
          <label className="field">
            <span>Kullanıcı adı</span>
            <input className="input input-locked" value={username} readOnly disabled autoComplete="username" aria-readonly />
          </label>
          {!p.open ? (
            <div className="field">
              <span>Şifre</span>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <input className="input input-locked grow" value="••••••••" readOnly disabled aria-label="Şifre gizli" />
                <button type="button" className="btn btn-ghost" onClick={p.start}>
                  Değiştir
                </button>
              </div>
              {p.done && (
                <p className="note small" role="status">
                  Şifren değiştirildi.
                </p>
              )}
            </div>
          ) : (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void p.submit();
              }}
            >
              <label className="field">
                <span>Mevcut şifre</span>
                <input
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={p.current}
                  onChange={(e) => p.setCurrent(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="field">
                <span>Yeni şifre</span>
                <input className="input" type="password" autoComplete="new-password" minLength={6} value={p.next} onChange={(e) => p.setNext(e.target.value)} />
              </label>
              <label className="field">
                <span>Yeni şifre (tekrar)</span>
                <input className="input" type="password" autoComplete="new-password" value={p.repeat} onChange={(e) => p.setRepeat(e.target.value)} />
              </label>
              {p.error && (
                <p className="alert" role="alert">
                  {p.error}
                </p>
              )}
              <div className="segmented">
                <button type="button" className="btn btn-ghost" onClick={p.cancel} disabled={p.busy}>
                  Vazgeç
                </button>
                <button type="submit" className="btn" disabled={p.busy}>
                  {p.busy ? "Kaydediliyor…" : "Şifreyi değiştir"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
