import { useEffect, useRef } from "react";
import { SendIcon } from "../components/Icons";
import { MAX_INPUT_CHARS } from "../config/ai";
import { useChat } from "../hooks/useChat";
import { useDay } from "../hooks/useDay";
import { useSession } from "../hooks/session";
import { useWeights } from "../hooks/useWeights";
import { bmr, ageFromBirthYear } from "../lib/calculations";
import { todayKey } from "../lib/dates";

const SUGGESTIONS = ["Akşam yemeği için ne önerirsin?", "Bugün ne kadar kalorim kaldı?", "Tatlı krizini nasıl atlatırım?"];

export default function Chat() {
  const { uid, userDoc } = useSession();
  const { profile, goal } = userDoc;
  const day = useDay(uid, todayKey(), goal);
  const { latest } = useWeights(uid);

  const chat = useChat(uid, {
    name: profile.name,
    dailyCalories: goal?.dailyCalories ?? 0,
    consumedToday: day.consumed,
    bmr: latest
      ? Math.round(
          bmr({
            weightKg: latest.weightKg,
            heightCm: profile.heightCm,
            age: ageFromBirthYear(profile.birthYear, new Date()),
            sex: profile.sex,
            bodyFatPct: profile.bodyFatPct,
          }).value,
        )
      : null,
    currentWeightKg: latest?.weightKg ?? null,
    targetWeightKg: goal?.targetWeightKg ?? null,
    targetDate: goal?.targetDate ?? null,
  });

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length, chat.loading]);

  return (
    <main className="stack-lg" style={{ paddingBottom: 72 }}>
      <div className="row between">
        <h2>Sohbet</h2>
        {chat.messages.length > 0 && (
          <button type="button" className="btn-text small" onClick={chat.clear}>
            Temizle
          </button>
        )}
      </div>

      {chat.messages.length === 0 && (
        <div className="stack fade-in">
          <p className="muted">
            Merhaba {profile.name}! Beslenme, kalori ya da spor hakkında ne istersen sor.
          </p>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="choice" onClick={() => chat.setInput(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="chat" aria-live="polite">
        {chat.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role} fade-in`}>
            {m.text}
          </div>
        ))}
        {chat.loading && (
          <div className="bubble model typing" aria-label="Yazıyor">
            <span />
            <span />
            <span />
          </div>
        )}
        {chat.error && <p className="alert">{chat.error}</p>}
        <div ref={endRef} />
      </div>

      <div className="chat-input">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void chat.send();
          }}
        >
          <textarea
            className="textarea"
            rows={1}
            value={chat.input}
            maxLength={MAX_INPUT_CHARS}
            placeholder="Bir şey sor…"
            onChange={(e) => chat.setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void chat.send();
              }
            }}
          />
          <button type="submit" className="btn" style={{ padding: "12px 14px" }} disabled={chat.loading || !chat.input.trim()} aria-label="Gönder">
            <SendIcon />
          </button>
        </form>
      </div>
    </main>
  );
}
