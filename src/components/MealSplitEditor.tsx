import { MEAL_LABELS, MEALS, mealTotal } from "../lib/calculations";
import type { Meal, MealCalories } from "../types";

interface Props {
  meals: MealCalories;
  dailyCalories: number;
  onChange: (meal: Meal, direction: 1 | -1) => void;
}

export function MealSplitEditor({ meals, dailyCalories, onChange }: Props) {
  const diff = dailyCalories - mealTotal(meals);
  return (
    <div className="stack">
      {MEALS.map((meal) => (
        <div key={meal} className="meal-row">
          <span>{MEAL_LABELS[meal]}</span>
          <button type="button" className="btn-icon" onClick={() => onChange(meal, -1)} aria-label={`${MEAL_LABELS[meal]} azalt`}>
            −
          </button>
          <strong>{meals[meal]}</strong>
          <button type="button" className="btn-icon" onClick={() => onChange(meal, 1)} aria-label={`${MEAL_LABELS[meal]} artır`}>
            +
          </button>
        </div>
      ))}
      <p className={diff === 0 ? "positive small" : "negative small"} aria-live="polite">
        {diff === 0
          ? `Toplam ${dailyCalories} kcal — tamam.`
          : diff > 0
            ? `${diff} kcal dağıtılmadı. Bir öğünü artır.`
            : `${-diff} kcal fazla. Bir öğünü azalt.`}
      </p>
    </div>
  );
}
