import { useState } from "react";
import { clampItemKcal, MAX_ITEM_KCAL, MAX_ITEM_NAME, suggestMeal, sumKcal } from "../lib/calculations";
import { todayKey } from "../lib/dates";
import { AiServiceError, analyzeFood } from "../services/ai";
import { addEntry, addWater } from "../services/db";
import type { EntryCategory, FoodItem, Meal } from "../types";

export type AddStep = "category" | "water" | "chat" | "result" | "manual" | "meal";
export type AddCategory = EntryCategory | "water";

/** "+" akışının tüm durumu. Görünüm (AddEntry sayfası) yalnızca bunu okur ve eylemleri çağırır. */
export function useAddEntry(uid: string, dateKey: string, onDone: () => void) {
  const [step, setStep] = useState<AddStep>("category");
  const [category, setCategory] = useState<EntryCategory>("food");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** AI başarısız olduysa manuel giriş seçeneği gösterilir. */
  const [canEnterManually, setCanEnterManually] = useState(false);

  const [aiItems, setAiItems] = useState<FoodItem[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [assumptions, setAssumptions] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [meal, setMeal] = useState<Meal>(() => suggestMeal(new Date().getHours()));

  const total = sumKcal(items);

  const reset = () => {
    setError(null);
    setCanEnterManually(false);
  };

  const chooseCategory = (c: AddCategory) => {
    reset();
    if (c === "water") {
      setStep("water");
      return;
    }
    setCategory(c);
    setStep("chat");
  };

  const submit = async () => {
    if (!text.trim() || loading) return;
    reset();
    setLoading(true);
    try {
      const result = await analyzeFood(uid, todayKey(), category, text);
      if (!result.isFood) {
        setError("Bunu bir yiyecek olarak algılayamadım. Ne yediğini biraz daha açık yazar mısın?");
        return;
      }
      setAiItems(result.items);
      setItems(result.items);
      setAssumptions(result.assumptions);
      setIsManual(false);
      setStep("result");
    } catch (err) {
      setError(err instanceof AiServiceError ? err.message : "Bir şeyler ters gitti.");
      setCanEnterManually(true);
    } finally {
      setLoading(false);
    }
  };

  const setItemKcal = (index: number, kcal: number) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, kcal: clampItemKcal(kcal) } : it)));

  const saveManual = (name: string, kcal: number) => {
    if (!(kcal > 0) || kcal > MAX_ITEM_KCAL) {
      setError(`Kalori 1–${MAX_ITEM_KCAL} arasında olmalı.`);
      return;
    }
    reset();
    const item: FoodItem = { name: (name.trim() || text.trim() || "Manuel kayıt").slice(0, MAX_ITEM_NAME), amount: "", grams: 0, kcal: clampItemKcal(kcal) };
    setAiItems([]);
    setItems([item]);
    setAssumptions("");
    setIsManual(true);
    setMeal(suggestMeal(new Date().getHours()));
    setStep("meal");
  };

  const accept = () => {
    reset();
    setMeal(suggestMeal(new Date().getHours()));
    setStep("meal");
  };

  const save = async () => {
    setLoading(true);
    reset();
    try {
      const aiKcal = isManual ? 0 : sumKcal(aiItems);
      await addEntry(uid, dateKey, {
        category,
        meal,
        rawText: text.trim(),
        items,
        totalKcal: total,
        aiKcal,
        editedByUser: isManual || items.some((it, i) => it.kcal !== aiItems[i]?.kcal),
      });
      onDone();
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. Tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  const saveWater = async (ml: number) => {
    if (!(ml > 0)) {
      setError("Geçerli bir miktar gir.");
      return;
    }
    setLoading(true);
    reset();
    try {
      await addWater(uid, dateKey, Math.round(ml));
      onDone();
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. Tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    reset();
    if (step === "result" || step === "manual") setStep("chat");
    else if (step === "meal") setStep(isManual ? "manual" : "result");
    else if (step === "chat" || step === "water") setStep("category");
    else onDone();
  };

  return {
    step,
    category,
    text,
    loading,
    error,
    canEnterManually,
    items,
    assumptions,
    total,
    meal,
    setText,
    setMeal,
    setItemKcal,
    chooseCategory,
    submit,
    /** ✗ — chat'e dön, metin korunur. */
    reject: () => {
      reset();
      setStep("chat");
    },
    /** ✓ — öğün seçimine geç. */
    accept,
    openManual: () => {
      reset();
      setStep("manual");
    },
    saveManual,
    save,
    saveWater,
    back,
  };
}
