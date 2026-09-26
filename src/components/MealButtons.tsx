import { MEAL_LABELS, MEALS } from "../lib/calculations";
import type { Meal } from "../types";

interface Props {
  value: Meal | null;
  onChange: (meal: Meal) => void;
  variant?: "big" | "compact";
}

export function MealButtons({ value, onChange, variant = "compact" }: Props) {
  if (variant === "big") {
    return (
      <div className="stack center">
        {MEALS.map((meal) => (
          <button key={meal} type="button" className="big-round" aria-pressed={value === meal} onClick={() => onChange(meal)}>
            {MEAL_LABELS[meal]}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="segmented">
      {MEALS.map((meal) => (
        <button key={meal} type="button" className="choice" aria-pressed={value === meal} onClick={() => onChange(meal)} style={{ textAlign: "center" }}>
          {MEAL_LABELS[meal]}
        </button>
      ))}
    </div>
  );
}
