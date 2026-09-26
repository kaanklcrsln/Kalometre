import type { EntryCategory } from "../types";

/** En ucuz Flash-Lite modeli. Adı AI Studio / Firebase dokümanlarından doğrulanmalı. */
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

/**
 * Maliyeti düşürmek için düşünme seviyesi. Model desteklemiyorsa istek hata verir;
 * o durumda undefined yap. Olası değerler: "MINIMAL" | "LOW" | "MEDIUM" | "HIGH".
 */
export const GEMINI_THINKING_LEVEL: string | undefined = undefined;

/** Kullanıcı başına günlük AI isteği sınırı (istemci tarafı, Firestore sayacı). */
export const DAILY_AI_REQUEST_LIMIT = 50;

/** Kullanıcı girdisinin azami uzunluğu (token maliyetini sınırlamak için). */
export const MAX_INPUT_CHARS = 500;

export const CATEGORY_LABELS: Record<EntryCategory, string> = {
  food: "Yiyecek",
  drink: "İçecek",
  snack: "Abur cubur",
};

export function buildSystemInstruction(category: EntryCategory): string {
  return (
    "Sen bir beslenme asistanısın. Kullanıcı yediği/içtiği şeyi Türkçe tarif eder. " +
    `Kategori: ${CATEGORY_LABELS[category].toLocaleLowerCase("tr-TR")}. ` +
    "Her kalemi ayrı çıkar, miktar belirtilmemişse Türkiye'deki tipik porsiyonu varsay, " +
    "gram ve kaloriyi standart besin değerlerine göre tahmin et. " +
    "Soru sorma; belirsizlikte en makul tahmini yap ve varsayımını 'assumptions' alanına kısaca yaz. " +
    "Girdi yiyecek/içecek değilse isFood=false döndür. Sadece JSON döndür."
  );
}

/** Sohbette modele gönderilen en fazla geçmiş mesaj sayısı (maliyet için). */
export const CHAT_HISTORY_LIMIT = 10;

export interface ChatContext {
  name: string;
  dailyCalories: number;
  consumedToday: number;
  bmr: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  targetDate: string | null;
}

export function buildChatInstruction(ctx: ChatContext): string {
  const lines = [
    `Sen Kalometre uygulamasının beslenme ve spor asistanısın. Kullanıcının adı ${ctx.name}.`,
    "Türkçe, samimi, kısa ve net cevap ver (en fazla birkaç paragraf). Uygun yerlerde kullanıcıya adıyla hitap et.",
    "Beslenme, kalori, egzersiz ve motivasyon konularında yardım et; bu konuların dışındaki soruları kibarca konuya geri getir.",
    "Tıbbi teşhis koyma, ilaç önerme. Kadınlar için günde 1200, erkekler için 1500 kcal'nin altında beslenmeyi asla önerme.",
    "Kullanıcının kalori hedefi uygulamada kilitlidir; hedefi değiştirmesini önerme.",
    `Günlük kalori hedefi: ${ctx.dailyCalories} kcal. Bugün şu ana kadar alınan: ${ctx.consumedToday} kcal.`,
  ];
  if (ctx.bmr) lines.push(`Bazal metabolizma: ${ctx.bmr} kcal.`);
  if (ctx.currentWeightKg) lines.push(`Güncel kilo: ${ctx.currentWeightKg} kg.`);
  if (ctx.targetWeightKg && ctx.targetDate) {
    lines.push(`Hedef: ${ctx.targetDate} tarihine kadar ${ctx.targetWeightKg} kg.`);
  }
  return lines.join("\n");
}
