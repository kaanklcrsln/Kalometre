// KaloAI'da anlatılan ya da fotoğrafı gönderilen yemeği öğüne ekleme: saf yardımcılar.

import type { AiAnalysis, FoodItem, Meal, NewEntry } from "../types";
import { clampItemKcal, MAX_ITEM_NAME, sumKcal } from "./calculations";

/** Sohbetin üstündeki "öğüne ekleyelim mi?" kutusunda gösterilen öneri. */
export interface FoodSuggestion {
  name: string;
  kcal: number;
  /** Yapay zekânın kalemleri (fotoğrafta birden fazla olabilir). */
  items: FoodItem[];
  /** Kaydın ham metni: kullanıcının mesajı ya da "Fotoğraf". */
  rawText: string;
}

export const PHOTO_RAW_TEXT = "Fotoğraf";

export function suggestionFromText(name: string, kcal: number, message: string): FoodSuggestion {
  const clean = name.trim().slice(0, MAX_ITEM_NAME);
  const k = clampItemKcal(kcal);
  return { name: clean, kcal: k, items: [{ name: clean, amount: "", grams: 0, kcal: k }], rawText: message.trim().slice(0, 500) };
}

export function suggestionFromAnalysis(a: AiAnalysis): FoodSuggestion | null {
  if (!a.isFood || a.items.length === 0) return null;
  const kcal = sumKcal(a.items);
  if (kcal <= 0) return null;
  const name = a.items
    .map((it) => it.name)
    .join(", ")
    .slice(0, MAX_ITEM_NAME);
  return { name, kcal, items: a.items, rawText: PHOTO_RAW_TEXT };
}

/** Fotoğraf analizinin sohbet balonundaki özeti. */
export function analysisSummary(a: AiAnalysis): string {
  if (!a.isFood || a.items.length === 0) return "Bu fotoğrafta bir yiyecek ya da içecek göremedim. Başka bir açıdan dener misin?";
  const lines = a.items.map((it) => `• ${it.name}${it.amount ? ` (${it.amount})` : ""}: ${it.kcal} kcal`);
  return [...lines, `Toplam yaklaşık ${sumKcal(a.items)} kcal.`].join("\n");
}

/**
 * Kullanıcının panelde onayladığı ad ve kaloriden kayıt. Ad ve kalori değişmediyse yapay zekânın kalemleri
 * korunur; değiştiyse tek kalem yazılır ve "düzenlendi" işaretlenir.
 */
export function entryFromSuggestion(s: FoodSuggestion, name: string, kcal: number, meal: Meal): NewEntry {
  const finalName = (name.trim() || s.name).slice(0, MAX_ITEM_NAME);
  const finalKcal = clampItemKcal(kcal);
  const unchanged = finalName === s.name && finalKcal === s.kcal && s.items.length > 0;
  const items: FoodItem[] = unchanged ? s.items : [{ name: finalName, amount: "", grams: 0, kcal: finalKcal }];
  return {
    category: "food",
    meal,
    rawText: s.rawText,
    items,
    totalKcal: sumKcal(items),
    aiKcal: s.kcal,
    editedByUser: finalKcal !== s.kcal,
  };
}
