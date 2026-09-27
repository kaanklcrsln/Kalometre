import { useEffect, useState } from "react";
import { CALORIE_STEP_KCAL, MAX_DAILY_KCAL, planHasDate, type Plan } from "../lib/calculations";
import { formatDateTr } from "../lib/dates";

interface Props {
  plan: Plan;
  onChange: (dailyCalories: number) => void;
}

const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

/** Günlük kalori seçimi: −/+ ya da yazarak; altında bu kalorinin sonucu (aynı formülle) gösterilir. */
export function CalorieTargetEditor({ plan, onChange }: Props) {
  const [text, setText] = useState(String(plan.dailyCalories));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(plan.dailyCalories));
  }, [plan.dailyCalories, focused]);

  const commit = (value: string) => {
    setText(value);
    const n = Number(value);
    if (Number.isInteger(n) && n >= plan.minCalories && n <= MAX_DAILY_KCAL) onChange(n);
  };

  const step = (direction: 1 | -1) =>
    onChange(Math.min(Math.max(plan.dailyCalories + direction * CALORIE_STEP_KCAL, plan.minCalories), MAX_DAILY_KCAL));

  return (
    <div className="stack">
      <div className="card card-dark stack">
        <p>Günlük kalorin</p>
        <div className="calorie-stepper">
          <button
            type="button"
            className="btn-icon"
            onClick={() => step(-1)}
            disabled={plan.dailyCalories <= plan.minCalories}
            aria-label="Günlük kaloriyi azalt"
          >
            −
          </button>
          <label className="calorie-input">
            <input
              inputMode="numeric"
              value={text}
              aria-label="Günlük kalori"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => commit(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            <span>kcal</span>
          </label>
          <button
            type="button"
            className="btn-icon"
            onClick={() => step(1)}
            disabled={plan.dailyCalories >= MAX_DAILY_KCAL}
            aria-label="Günlük kaloriyi artır"
          >
            +
          </button>
        </div>
        <p className="small" style={{ opacity: 0.8 }}>
          Önerimiz {plan.suggestedCalories} kcal · en az {plan.minCalories} kcal
        </p>
      </div>

      <p aria-live="polite" style={{ fontWeight: 600 }}>
        {planHasDate(plan) ? (
          <>
            Günde {plan.dailyCalories} kcal ile ayda {fmt(plan.monthlyKg)} kg verir, hedefine{" "}
            <span className="positive">{plan.days} gün</span> sonra ({formatDateTr(plan.targetDate)}) ulaşırsın.
          </>
        ) : plan.direction === "lose" ? (
          <span className="negative">{plan.notices[plan.notices.length - 1]}</span>
        ) : plan.dailyDeficit > 0 ? (
          <>Harcamanın {plan.dailyDeficit} kcal altındasın; kilon yavaşça azalır.</>
        ) : plan.dailyDeficit < 0 ? (
          <>Harcamanın {-plan.dailyDeficit} kcal üstündesin; kilon yavaşça artar.</>
        ) : (
          <>Bu kaloriyle kilonu korursun.</>
        )}
      </p>
      {planHasDate(plan) && plan.dailyCalories === plan.minCalories && plan.paceKgPerMonth > plan.maxSafeKgPerMonth && (
        <p className="note small">Sağlığın için {plan.minCalories} kcal'nin altına inmiyoruz.</p>
      )}
    </div>
  );
}
