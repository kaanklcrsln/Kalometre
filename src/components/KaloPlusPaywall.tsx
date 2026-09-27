import { KALO_PLUS } from "../config/plans";
import { useUnlock } from "../hooks/useUnlock";
import { CheckIcon, LockIcon } from "./Icons";

interface Props {
  uid: string;
  username: string;
  name: string;
}

/** Kalo+ gerektiren ekranlarda gösterilen kilit. */
export function KaloPlusPaywall({ uid, username, name }: Props) {
  const u = useUnlock(uid, username, name);
  const pending = u.status === "pending";

  return (
    <section className="paywall fade-in" aria-labelledby="paywall-title">
      <div className="paywall-lock">
        <LockIcon />
      </div>
      <h2 id="paywall-title">{KALO_PLUS.name} ile açılır</h2>
      <ul className="paywall-features">
        {KALO_PLUS.features.map((f) => (
          <li key={f}>
            <span className="positive">
              <CheckIcon />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <p className="muted">{KALO_PLUS.fallbackPriceLabel}</p>
      <button type="button" className="btn btn-positive btn-block" onClick={() => void u.unlock()} disabled={u.busy || pending}>
        {u.busy ? "Gönderiliyor…" : pending ? "Onay bekleniyor…" : "Kilidi aç"}
      </button>
      {pending && (
        <p className="note small" role="status">
          İsteğin yöneticiye iletildi, {name}. Onaylanınca bu ekran kendiliğinden açılacak.
        </p>
      )}
      {u.status === "rejected" && (
        <p className="alert small" role="status">
          Önceki isteğin onaylanmadı. İstersen yeniden isteyebilirsin.
        </p>
      )}
      {u.status === "approved" && (
        <p className="note small" role="status">
          Önceki üyeliğinin süresi doldu. Yeniden isteyebilirsin.
        </p>
      )}
      {u.error && (
        <p className="alert small" role="alert">
          {u.error}
        </p>
      )}
    </section>
  );
}
