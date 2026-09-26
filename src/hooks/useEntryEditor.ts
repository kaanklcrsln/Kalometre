import { useState } from "react";
import { clampItemKcal, sumKcal } from "../lib/calculations";
import type { Entry, FoodItem, Meal, NewEntry } from "../types";

/** Kayıtlı bir girdinin kalori ve öğününü düzenleme durumu. */
export function useEntryEditor(
  entry: Entry,
  onSave: (patch: Partial<NewEntry>) => Promise<void>,
  onDelete: () => Promise<void>,
) {
  const [items, setItems] = useState<FoodItem[]>(entry.items);
  const [meal, setMeal] = useState<Meal>(entry.meal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = sumKcal(items);
  const kcalChanged = items.some((item, i) => item.kcal !== entry.items[i]?.kcal);

  const setItemKcal = (index: number, kcal: number) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, kcal: clampItemKcal(kcal) } : it)));

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      console.error(err);
      setError("İşlem başarısız. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  return {
    items,
    meal,
    total,
    busy,
    error,
    setMeal,
    setItemKcal,
    save: () =>
      run(() =>
        onSave({
          items,
          meal,
          totalKcal: total,
          editedByUser: entry.editedByUser || kcalChanged,
        }),
      ),
    remove: () => run(onDelete),
  };
}
