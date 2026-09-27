import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useAvatarMood } from "../avatar/AvatarProvider";
import { SendIcon } from "../components/Icons";
import { KaloPlusPaywall } from "../components/KaloPlusPaywall";
import { MAX_INPUT_CHARS } from "../config/ai";
import { useChat } from "../hooks/useChat";
import { useDay } from "../hooks/useDay";
import { useEntitlement } from "../hooks/useEntitlement";
import { useSession } from "../hooks/session";
import { useWeights } from "../hooks/useWeights";
import { bmr, ageFromBirthYear } from "../lib/calculations";
import { todayKey } from "../lib/dates";

const Mascot = lazy(() => import("../avatar/Mascot").then((m) => ({ default: m.Mascot })));
const HERO_SIZE = 128;
/** styles.css'teki .fade-out süresiyle aynı. */
const FADE_MS = 600;

/**
 * Sohbet boşken ortada duran avatar. İlk mesaj gönderilince yavaşça kaybolur;
 * sohbet temizlenirse (ya da mesaj gönderilemezse) geri gelir.
 */
function useHeroMascot(empty: boolean) {
  const [visible, setVisible] = useState(empty);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (empty) {
      setVisible(true);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const t = setTimeout(() => setVisible(false), FADE_MS);
    return () => clearTimeout(t);
  }, [empty]);
  return { visible, leaving };
}

/** KaloAI yalnızca Kalo+ üyelerine açık; diğerleri kilit ekranını görür. */
export default function Chat() {
  const { uid, username, userDoc } = useSession();
  const { kaloPlus, loading } = useEntitlement(uid);

  if (loading) {
    return (
      <main className="fullscreen">
        <div className="spinner" style={{ margin: "0 auto" }} />
      </main>
    );
  }
  if (!kaloPlus) {
    return (
      <main className="stack-lg">
        <h2>KaloAI</h2>
        <KaloPlusPaywall uid={uid} username={username} name={userDoc.profile.name} />
      </main>
    );
  }
  return <ChatScreen />;
}

function ChatScreen() {
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

  useAvatarMood("curious");
  const hero = useHeroMascot(chat.messages.length === 0);

  // Yazı kutusu içerikle birlikte en fazla ~5 satıra kadar büyür.
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 3, 140)}px`;
  }, [chat.input]);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length, chat.loading]);

  return (
    <main className="stack-lg" style={{ paddingBottom: 72 }}>
      <div className="row between">
        <h2>KaloAI</h2>
        {chat.messages.length > 0 && (
          <button type="button" className="btn-text small" onClick={chat.clear}>
            Temizle
          </button>
        )}
      </div>

      {hero.visible && (
        // Sayfa akışını etkilemesin diye ekranın ortasına sabitlenir; mesajlar altında akar.
        <div className={`chat-hero ${hero.leaving ? "fade-out" : "fade-in"}`}>
          <Suspense fallback={<div style={{ width: HERO_SIZE, height: HERO_SIZE }} />}>
            <Mascot size={HERO_SIZE} followTyping />
          </Suspense>
          <p className="muted center">Merhaba {profile.name}! Beslenme, kalori ya da spor hakkında ne istersen sor.</p>
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
            ref={inputRef}
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
          <button type="submit" className="btn btn-send" disabled={chat.loading || !chat.input.trim()} aria-label="Gönder">
            <SendIcon />
          </button>
        </form>
      </div>
    </main>
  );
}
