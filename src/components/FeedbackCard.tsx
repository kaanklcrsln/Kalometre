import { useId, useState } from "react";
import { useFeedback } from "../hooks/useFeedback";
import { NOTE_MAX, NOTE_TYPE_LABELS, type NoteType } from "../lib/notes";

interface Props {
  uid: string;
  username: string;
  name: string;
}

/** Ayarlar > Şikayet ve öneri. Varsayılan kapalı; başlığa tıklayınca açılır. Günde 1 not; admin panelinde görünür. */
export function FeedbackCard({ uid, username, name }: Props) {
  const f = useFeedback(uid, username, name);
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <section className="card stack" id="geri-bildirim">
      <button
        type="button"
        className="card-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <h3>Şikayet ve öneri</h3>
        <span className="card-toggle-icon" aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div id={bodyId} className="stack">
          {f.loading ? (
            <div className="spinner" />
          ) : f.sentToday ? (
            <div className="stack">
              <p className="note small" role="status">
                Notun bize ulaştı, teşekkürler {name}! Günde bir not gönderebilirsin; yarın tekrar yazabilirsin.
              </p>
              {f.todayNote && (
                <p className="small muted" style={{ whiteSpace: "pre-wrap" }}>
                  <strong>{NOTE_TYPE_LABELS[f.todayNote.type]}:</strong> {f.todayNote.text}
                </p>
              )}
            </div>
          ) : (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void f.submit();
              }}
            >
              <div className="segmented">
                {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={f.type === t} onClick={() => f.setType(t)} style={{ textAlign: "center" }}>
                    {NOTE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Notun (günde 1 kez)</span>
                <textarea
                  className="textarea"
                  rows={4}
                  maxLength={NOTE_MAX}
                  value={f.text}
                  onChange={(e) => f.setText(e.target.value)}
                  placeholder="Şikayetini ya da önerini yaz…"
                />
              </label>
              <div className="row between">
                <span className="small muted">
                  {f.text.trim().length}/{NOTE_MAX}
                </span>
                <button type="submit" className="btn" disabled={f.busy || !f.text.trim()}>
                  {f.busy ? "Gönderiliyor…" : "Gönder"}
                </button>
              </div>
              {f.error && (
                <p className="alert" role="alert">
                  {f.error}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </section>
  );
}
