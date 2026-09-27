import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { useAvatarMood } from "../avatar/AvatarProvider";
import { HOME_MOODS } from "../avatar/moods";
import { DateSwitcher } from "../components/DateSwitcher";
import { EntryList } from "../components/EntryList";
import { ProgressRing } from "../components/ProgressRing";
import { WaterCounter } from "../components/WaterCounter";
import { useDay } from "../hooks/useDay";
import { useSelectedDate } from "../hooks/useSelectedDate";
import { useSession } from "../hooks/session";
import { MEAL_LABELS } from "../lib/calculations";
import { daysBetween, todayKey } from "../lib/dates";

// Avatar kütüphanesi büyük; ana sayfa açıldıktan sonra yüklensin.
const Mascot = lazy(() => import("../avatar/Mascot").then((m) => ({ default: m.Mascot })));
const MASCOT_SIZE = 64;

function greeting(hour: number): string {
  if (hour >= 5 && hour < 11) return "Günaydın";
  if (hour >= 11 && hour < 17) return "İyi günler";
  if (hour >= 17 && hour < 22) return "İyi akşamlar";
  return "İyi geceler";
}

export default function Home() {
  const { uid, userDoc } = useSession();
  const { profile, goal } = userDoc;
  const date = useSelectedDate();
  const day = useDay(uid, date.dateKey, goal);
  const daysLeft = goal ? Math.max(daysBetween(todayKey(), goal.targetDate), 0) : 0;
  const over = day.remaining < 0;
  const ratio = day.dailyTarget ? Math.min(day.consumed / day.dailyTarget, 1) : 0;
  useAvatarMood(over ? HOME_MOODS.over : day.consumed > 0 ? HOME_MOODS.onTrack : HOME_MOODS.empty);

  return (
    <main className="stack-lg fade-in">
      <header className="row between" style={{ flexWrap: "nowrap" }}>
        <h1 style={{ fontSize: 16, fontWeight: 400, minWidth: 0 }}>
          <span className="muted">{greeting(new Date().getHours())},</span> <strong>{profile.name}</strong>
        </h1>
        <Suspense fallback={<div style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }} />}>
          <Mascot size={MASCOT_SIZE} />
        </Suspense>
      </header>

      <DateSwitcher dateKey={date.dateKey} isToday={date.isToday} onPrev={date.prev} onNext={date.next} onToday={date.goToday} />

      <section className="rings">
        {day.meals.map((m) => (
          <ProgressRing key={m.meal} label={MEAL_LABELS[m.meal]} consumed={m.consumed} target={m.target} />
        ))}
      </section>

      <section className="card stack">
        <div className="row between">
          <p>
            <strong style={{ fontSize: 22 }}>{day.consumed}</strong>
            <span className="muted"> / {day.dailyTarget} kcal</span>
          </p>
          <p className={over ? "negative" : "positive"} style={{ fontWeight: 600 }}>
            {over ? `${-day.remaining} kcal fazla` : `${day.remaining} kcal kaldı`}
          </p>
        </div>
        <div className={`bar ${over ? "over" : ""}`}>
          <div style={{ width: `${ratio * 100}%` }} />
        </div>
      </section>

      {/* key: gün değişince bardak sayısı varsayılana (5) döner. */}
      <WaterCounter key={date.dateKey} waterMl={day.waterMl} onAdd={(ml) => void day.addWater(ml)} />

      {goal && goal.targetWeightKg < goal.startWeightKg && (
        <Link to="/weight" className="card row between" style={{ color: "inherit", textDecoration: "none" }}>
          <span>
            <span className="tag">Hedef</span>
            <br />
            {daysLeft > 0 ? (
              <>
                {goal.targetWeightKg} kg için <strong className="positive">{daysLeft} gün</strong> kaldı
              </>
            ) : (
              <>Hedef tarihine ulaştın, {profile.name}!</>
            )}
          </span>
          <span aria-hidden>›</span>
        </Link>
      )}

      {day.error && <p className="alert">{day.error}</p>}
      {day.loading ? (
        <div className="spinner" style={{ margin: "0 auto" }} />
      ) : (
        <EntryList meals={day.meals} onUpdate={day.updateEntry} onDelete={day.deleteEntry} />
      )}
    </main>
  );
}
