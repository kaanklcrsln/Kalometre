import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AdminUserRow } from "../services/db";

interface Props {
  adminUid: string;
  onClose: () => void;
}

const formatDate = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString("tr-TR", { dateStyle: "medium" }) : "");

/**
 * Admin: kayıtlı kullanıcılar (ekranın ortasında açılan panel).
 * Kaldırma uygulama içinden yapılır; şifre değiştirme Admin SDK gerektirdiği için komut olarak verilir.
 */
export function UsersPanel({ adminUid, onClose }: Props) {
  const a = useAdminUsers(adminUid, true);
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc ile kapat, açılınca odak panele gelsin.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const command = (username: string) => `npm run users -- password ${username} <yeni-şifre>`;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const confirmRemove = (row: AdminUserRow) => {
    const ok = confirm(
      `${row.name} (@${row.username}) kaldırılsın mı?\n\nTüm verileri (profil, kilolar, yemek kayıtları, üyelik, notlar) silinir ve hesap kilitlenir. Bu işlem geri alınamaz; yalnızca kilit açılabilir.`,
    );
    if (ok) void a.remove(row);
  };

  // Sayfanın giriş animasyonu (transform) sabit konumlu öğeleri kendi kutusuna hapseder; panel doğrudan
  // body'ye çizilir ki tüm ekranı kaplasın ve alt barın üstünde kalsın.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card stack" role="dialog" aria-modal="true" aria-labelledby="users-title" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2 id="users-title">Kullanıcılar</h2>
          <button ref={closeRef} type="button" className="btn-icon" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </div>

        {a.error && <p className="alert small">{a.error}</p>}

        {a.loading && a.users.length === 0 ? (
          <div className="spinner" style={{ margin: "0 auto" }} />
        ) : (
          <>
            <p className="small muted">{a.users.length} kullanıcı · onboarding'i bitirmemiş hesaplar burada görünmez.</p>
            <ul className="entry-list">
              {a.users.map((u) => {
                const self = u.uid === adminUid;
                return (
                  <li key={u.uid} className="user-row stack">
                    <div className="row between">
                      <span>
                        <strong>{u.name}</strong> <span className="small muted">@{u.username}</span>
                      </span>
                      {u.kaloPlus && <span className="tag positive">Kalo+</span>}
                    </div>
                    <span className="small muted">
                      Kayıt: {formatDate(u.createdAtMs)}
                      {self && " · sen"}
                    </span>
                    {!self && (
                      <div className="row">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-expanded={passwordFor === u.uid}
                          onClick={() => setPasswordFor(passwordFor === u.uid ? null : u.uid)}
                        >
                          Şifre
                        </button>
                        <button type="button" className="btn btn-negative btn-sm" disabled={a.busyUid === u.uid} onClick={() => confirmRemove(u)}>
                          {a.busyUid === u.uid ? "Kaldırılıyor…" : "Kaldır"}
                        </button>
                      </div>
                    )}
                    {passwordFor === u.uid && (
                      <div className="note small stack">
                        <span>
                          Başkasının şifresini değiştirmek sunucu yetkisi (Admin SDK) gerektirir; uygulama içinden yapılamaz. Bilgisayarında
                          proje klasöründe çalıştır:
                        </span>
                        <code className="cmd">{command(u.username)}</code>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copy(command(u.username))}>
                          {copied ? "Kopyalandı" : "Komutu kopyala"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {a.disabled.length > 0 && (
              <>
                <h3>Kaldırılanlar</h3>
                <ul className="entry-list">
                  {a.disabled.map((d) => (
                    <li key={d.uid} className="user-row row between">
                      <span>
                        <span className="small muted">@{d.username}</span>
                        <br />
                        <span className="small muted">{formatDate(d.disabledAtMs)}</span>
                      </span>
                      <button type="button" className="btn btn-ghost btn-sm" disabled={a.busyUid === d.uid} onClick={() => void a.restore(d)}>
                        Kilidi aç
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="small muted">
                  Kilidi açılan kişi yeniden profil oluşturabilir; silinen verileri geri gelmez. Giriş hesabını tamamen silmek için:{" "}
                  <code>npm run users -- delete &lt;kullanıcıadı&gt;</code>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
