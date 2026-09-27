import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGoalEditor } from "../hooks/useGoalEditor";
import type { Goal, Profile } from "../types";
import { CalorieTargetEditor } from "./CalorieTargetEditor";
import { MealSplitEditor } from "./MealSplitEditor";

interface Props {
  uid: string;
  profile: Profile;
  goal: Goal;
  onClose: () => void;
}

/** Günlük kalori ve öğün dağılımını değiştirme paneli (ekranın ortasında). */
export function GoalEditor({ uid, profile, goal, onClose }: Props) {
  const g = useGoalEditor(uid, profile, goal, onClose);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Sayfa animasyonunun transform'u sabit konumu hapsetmesin diye doğrudan body'ye çizilir.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal card stack"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-editor-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          void g.save();
        }}
      >
        <div className="row between">
          <h2 id="goal-editor-title">Günlük hedef</h2>
          <button ref={closeRef} type="button" className="btn-icon" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </div>

        {g.loading ? (
          <div className="spinner" style={{ margin: "0 auto" }} />
        ) : (
          <>
            <p className="small muted">
              Harcaman şu anki kilonla ({g.currentWeightKg} kg) günde yaklaşık {g.plan.dailyBurn} kcal (bazal {g.plan.bmr}
              {g.plan.sportKcalPerDay > 0 ? `, spor ~${g.plan.sportKcalPerDay}` : ""}).
            </p>

            <CalorieTargetEditor plan={g.plan} onChange={g.changeCalories} />

            <div className="stack">
              <h3>Öğünler</h3>
              <MealSplitEditor meals={g.meals} dailyCalories={g.plan.dailyCalories} onChange={g.changeMeal} />
            </div>

            {g.error && (
              <p className="alert" role="alert">
                {g.error}
              </p>
            )}

            <button type="submit" className="btn btn-positive btn-block" disabled={g.saving || !g.changed || !g.mealsValid || g.unreachable}>
              {g.saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </>
        )}
      </form>
    </div>,
    document.body,
  );
}
