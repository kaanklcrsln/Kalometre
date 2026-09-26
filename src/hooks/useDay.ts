import { useEffect, useMemo, useState } from "react";
import { MEALS } from "../lib/calculations";
import { addWater, deleteEntry, subscribeDay, subscribeEntries, updateEntry } from "../services/db";
import type { Entry, Goal, Meal, NewEntry } from "../types";

export interface MealSummary {
  meal: Meal;
  consumed: number;
  target: number;
  entries: Entry[];
}

export function useDay(uid: string, dateKey: string, goal: Goal | null) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const onError = (err: Error) => {
      console.error(err);
      setError("Veriler yüklenemedi.");
    };
    const unsubEntries = subscribeEntries(
      uid,
      dateKey,
      (e) => {
        setEntries(e);
        setLoading(false);
      },
      onError,
    );
    const unsubDay = subscribeDay(uid, dateKey, (d) => setWaterMl(d.waterMl), onError);
    return () => {
      unsubEntries();
      unsubDay();
    };
  }, [uid, dateKey]);

  const dailyTarget = goal?.dailyCalories ?? 0;

  const meals: MealSummary[] = useMemo(() => {
    const targets = goal?.mealCalories ?? null;
    return MEALS.map((meal) => {
      const mealEntries = entries.filter((e) => e.meal === meal);
      return {
        meal,
        consumed: mealEntries.reduce((sum, e) => sum + e.totalKcal, 0),
        target: targets?.[meal] ?? 0,
        entries: mealEntries,
      };
    });
  }, [entries, goal]);

  const consumed = meals.reduce((sum, m) => sum + m.consumed, 0);

  return {
    loading,
    error,
    meals,
    consumed,
    dailyTarget,
    remaining: dailyTarget - consumed,
    waterMl,
    addWater: (ml: number) => addWater(uid, dateKey, ml),
    updateEntry: (id: string, patch: Partial<NewEntry>) => updateEntry(uid, dateKey, id, patch),
    deleteEntry: (id: string) => deleteEntry(uid, dateKey, id),
  };
}
