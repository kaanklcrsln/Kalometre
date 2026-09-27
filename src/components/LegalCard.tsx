import { useId, useState } from "react";
import { AVATAR_REPO_URL, PRIVACY_NOTICE, SOURCE_REPO_URL } from "../config/legal";

/** Ayarlar > Gizlilik ve açık kaynak. Varsayılan kapalı. */
export function LegalCard() {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <section className="card stack">
      <button type="button" className="card-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
        <h3>Gizlilik ve açık kaynak</h3>
        <span className="card-toggle-icon" aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div id={bodyId} className="stack small">
          <p>
            <strong>Gizlilik.</strong> {PRIVACY_NOTICE}
          </p>
          <p>
            <strong>Açık kaynak.</strong> Kalometre'nin kaynak kodu herkese açıktır:{" "}
            <a href={SOURCE_REPO_URL} target="_blank" rel="noopener noreferrer">
              github.com/kaanklcrsln/Kalometre
            </a>
          </p>
          <p>
            Avatar,{" "}
            <a href={AVATAR_REPO_URL} target="_blank" rel="noopener noreferrer">
              bible-strong-avatar-lab
            </a>{" "}
            (Stéphane Montlouis-Calixte) projesinin <code>@bible-strong/avatar-react</code> paketiyle yapılmıştır ve GNU AGPL-3.0
            lisansı altındadır.
          </p>
        </div>
      )}
    </section>
  );
}
