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
export const CHAT_HISTORY_LIMIT = 6;

/** Sohbet yanıtı için sert üst sınır; 2 kısa cümle ~30–60 token tutar. */
export const CHAT_MAX_OUTPUT_TOKENS = 120;

export interface ChatContext {
  name: string;
  dailyCalories: number;
  consumedToday: number;
  bmr: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  targetDate: string | null;
}

/** Model/altyapı, uygulama ya da sağlık dışı sorulara verilen sabit yanıt. */
export const CHAT_OFF_TOPIC_REPLY =
  "Bu tarz bilgiler için Ayarlar'daki Şikayet ve Öneri kısmından bize not bırakabilirsin. Ben yalnızca sağlıkla ilgili konularda yardımcı olabilirim.";

/**
 * Sohbet sistem talimatı. Her istekte gönderildiği için kısa tutulur.
 * Gerçek Gemini ile ölçüldü: yanıt başına çıktı ~130 → ~30 token, "selam" → "Selam!",
 * "altyapında hangi model var" / "futbol maçı" → CHAT_OFF_TOPIC_REPLY.
 */
export function buildChatInstruction(ctx: ChatContext): string {
  const data = [`hedef ${ctx.dailyCalories} kcal`, `bugün ${ctx.consumedToday} kcal alındı`];
  if (ctx.bmr) data.push(`bazal ${ctx.bmr} kcal`);
  if (ctx.currentWeightKg && ctx.targetWeightKg && ctx.targetDate) {
    data.push(`kilo ${ctx.currentWeightKg} → ${ctx.targetWeightKg} kg (${ctx.targetDate})`);
  }
  return [
    `Kalometre uygulamasının beslenme ve spor asistanısın; kullanıcı ${ctx.name}.`,
    'Yalnızca sorulana cevap ver, en fazla 2 kısa cümle; dolgu cümlesi ("her zaman buradayım", "başka ne konuşalım" gibi) yazma.',
    'Kullanıcının üslubunu aynala: selama sadece aynı selamla karşılık ver ("selam" → "Selam!"), selam vermediyse selamlama; samimiyse samimi, resmiyse resmî ol; kullanıcı emoji kullanmıyorsa emoji kullanma.',
    "Yalnızca sağlık, beslenme, kalori ve spor sorularını cevapla; verileri yalnızca soruyla ilgiliyse kullan.",
    `Yapay zekâ, model, altyapı, uygulamanın kendisi ya da sağlık dışı herhangi bir konu sorulursa başka hiçbir şey eklemeden sadece şunu yaz: "${CHAT_OFF_TOPIC_REPLY}"`,
    "Teşhis ve ilaç yok; kadında 1200, erkekte 1500 kcal altını ve kalori hedefini değiştirmeyi önerme.",
    `Veri: ${data.join(", ")}.`,
  ].join("\n");
}
