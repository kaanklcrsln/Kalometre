import { useState } from "react";
import {
  adjustMeal,
  isMealSplitValid,
  MAX_DAILY_KCAL,
  MEAL_STEP_KCAL,
  MEALS,
  rescaleMeals,
  updateGoalCalories,
} from "../lib/calculations";
import { updateUser } from "../services/db";
import type { Goal, Meal, MealCalories, Profile } from "../types";
import { useWeights } from "./useWeights";

/**
 * Günlük kaloriyi ve öğün dağılımını sonradan değiştirme. Hedef tarihi en son girilen kiloya ve yeni kaloriye
 * göre yeniden hesaplanır; hedef kilo ve kilit değişmez (Firestore kuralı da yalnızca bu alanlara izin verir).
 */
export function useGoalEditor(uid: string, profile: Profile, goal: Goal, onSaved?: () => void) {
  const { latest, loading } = useWeights(uid);
  const [calories, setCalories] = useState(goal.dailyCalories);
  const [meals, setMeals] = useState<MealCalories>(goal.mealCalories);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const currentWeightKg = latest?.weightKg ?? goal.startWeightKg;
  const result = updateGoalCalories(profile, goal, currentWeightKg, calories, meals, today);
  const { plan } = result;
  const isLoseGoal = goal.targetWeightKg < goal.startWeightKg;
  const unreachable = isLoseGoal && plan.direction === "lose" && !plan.reachable;
  const mealsValid = isMealSplitValid(meals, plan.dailyCalories);
  const changed = plan.dailyCalories !== goal.dailyCalories || MEALS.some((m) => meals[m] !== goal.mealCalories[m]);

  const changeCalories = (value: number) => {
    const next = Math.min(Math.max(Math.round(value), plan.minCalories), MAX_DAILY_KCAL);
    setCalories(next);
    setMeals((m) => rescaleMeals(m, next));
    setError(null);
  };

  const changeMeal = (meal: Meal, direction: 1 | -1) => {
    setMeals((m) => adjustMeal(m, meal, direction * MEAL_STEP_KCAL));
    setError(null);
  };

  const save = async () => {
    if (unreachable) {
      setError("Bu kaloriyle hedefine ulaşamazsın. Günlük kaloriyi biraz düşür.");
      return;
    }
    if (!mealsValid) {
      setError("Öğünlerin toplamı günlük kaloriye eşit olmalı.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateUser(uid, { goal: result.goal });
      onSaved?.();
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.");
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    currentWeightKg,
    plan,
    meals,
    mealsValid,
    changed,
    unreachable,
    saving,
    error,
    changeCalories,
    changeMeal,
    save,
  };
}
