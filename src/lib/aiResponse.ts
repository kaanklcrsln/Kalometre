// Gemini yanıtını doğrular ve temizler. Model şemaya uysa bile değerlere körü körüne güvenilmez.

import type { AiAnalysis, FoodItem } from "../types";

const MAX_ITEMS = 20;
const MAX_KCAL_PER_ITEM = 5000;
const MAX_GRAMS_PER_ITEM = 5000;

const clampNumber = (value: unknown, max: number): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n), max);
};

const cleanString = (value: unknown, maxLength: number): string =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

/** Geçersiz JSON/yapı için null döner. */
export function parseAiAnalysis(raw: string): AiAnalysis | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const items: FoodItem[] = (Array.isArray(obj.items) ? obj.items : [])
    .slice(0, MAX_ITEMS)
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      name: cleanString(item.name, 80) || "Bilinmeyen",
      amount: cleanString(item.amount, 40),
      grams: clampNumber(item.grams, MAX_GRAMS_PER_ITEM),
      kcal: clampNumber(item.kcal, MAX_KCAL_PER_ITEM),
    }));

  const isFood = obj.isFood !== false && items.length > 0;

  return {
    items: isFood ? items : [],
    assumptions: cleanString(obj.assumptions, 400),
    isFood,
  };
}
