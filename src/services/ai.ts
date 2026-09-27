// Gemini çağrısı — Firebase AI Logic (Gemini Developer API backend) üzerinden.
// API anahtarı istemcide YOK; istekler Firebase proxy'sinden geçer ve App Check ile korunur.

import {
  AIError,
  AIErrorCode,
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  Schema,
  type GenerationConfig,
} from "firebase/ai";
import { app } from "../config/firebase";
import {
  buildChatInstruction,
  buildSystemInstruction,
  CHAT_HISTORY_LIMIT,
  CHAT_MAX_OUTPUT_TOKENS,
  type ChatContext,
  DAILY_AI_REQUEST_LIMIT,
  GEMINI_MODEL,
  GEMINI_THINKING_LEVEL,
  MAX_INPUT_CHARS,
} from "../config/ai";
import { parseAiAnalysis } from "../lib/aiResponse";
import type { AiAnalysis, ChatMessage, EntryCategory } from "../types";
import { reserveAiRequest } from "./db";

const ai = getAI(app, { backend: new GoogleAIBackend() });

const responseSchema = Schema.object({
  properties: {
    items: Schema.array({
      items: Schema.object({
        properties: {
          name: Schema.string(),
          amount: Schema.string(),
          grams: Schema.number(),
          kcal: Schema.number(),
        },
      }),
    }),
    assumptions: Schema.string(),
    isFood: Schema.boolean(),
  },
});

const generationConfig: GenerationConfig = {
  responseMimeType: "application/json",
  responseSchema,
  ...(GEMINI_THINKING_LEVEL ? { thinkingConfig: { thinkingLevel: GEMINI_THINKING_LEVEL } } : {}),
} as GenerationConfig;

export type AiErrorKind =
  | "daily-limit"
  | "rate-limit"
  | "network"
  | "not-configured"
  | "app-check"
  | "bad-response"
  | "unknown";

export class AiServiceError extends Error {
  constructor(
    public readonly kind: AiErrorKind,
    message: string,
  ) {
    super(message);
  }
}

const MESSAGES: Record<AiErrorKind, string> = {
  "daily-limit": `Bugünkü ${DAILY_AI_REQUEST_LIMIT} yapay zekâ hakkını doldurdun. Yarın tekrar dene.`,
  "rate-limit": "Şu an çok fazla istek var. Biraz sonra tekrar dene.",
  network: "İnternet bağlantısı yok gibi görünüyor.",
  "not-configured": "Yapay zekâ servisi henüz yapılandırılmamış.",
  "app-check": "Uygulama doğrulanamadı. Sayfayı yenileyip tekrar dene.",
  "bad-response": "Yanıt anlaşılamadı. Tekrar dene.",
  unknown: "Bir şeyler ters gitti. Tekrar dene.",
};

function toServiceError(error: unknown): AiServiceError {
  if (error instanceof AiServiceError) return error;
  if (error instanceof AIError) {
    const status = error.customErrorData?.status;
    if (status === 429) return new AiServiceError("rate-limit", MESSAGES["rate-limit"]);
    if (status === 401 || status === 403) {
      const kind = error.code === AIErrorCode.API_NOT_ENABLED ? "not-configured" : "app-check";
      return new AiServiceError(kind, MESSAGES[kind]);
    }
    if (error.code === AIErrorCode.API_NOT_ENABLED || error.code === AIErrorCode.NO_API_KEY) {
      return new AiServiceError("not-configured", MESSAGES["not-configured"]);
    }
    if (error.code === AIErrorCode.FETCH_ERROR && status === undefined) {
      return new AiServiceError("network", MESSAGES.network);
    }
    if (error.code === AIErrorCode.PARSE_FAILED || error.code === AIErrorCode.RESPONSE_ERROR) {
      return new AiServiceError("bad-response", MESSAGES["bad-response"]);
    }
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new AiServiceError("network", MESSAGES.network);
  }
  return new AiServiceError("unknown", MESSAGES.unknown);
}

/**
 * Tek turluk analiz: sohbet geçmişi gönderilmez.
 * @param todayKey Günlük kota sayacının yazılacağı gün (kaydın günü değil, bugün).
 */
export async function analyzeFood(
  uid: string,
  todayKey: string,
  category: EntryCategory,
  text: string,
): Promise<AiAnalysis> {
  const input = text.trim().slice(0, MAX_INPUT_CHARS);
  try {
    const allowed = await reserveAiRequest(uid, todayKey, DAILY_AI_REQUEST_LIMIT);
    if (!allowed) throw new AiServiceError("daily-limit", MESSAGES["daily-limit"]);

    const model = getGenerativeModel(ai, {
      model: GEMINI_MODEL,
      systemInstruction: buildSystemInstruction(category),
      generationConfig,
    });
    const result = await model.generateContent(input);
    const parsed = parseAiAnalysis(result.response.text());
    if (!parsed) throw new AiServiceError("bad-response", MESSAGES["bad-response"]);
    return parsed;
  } catch (error) {
    console.error("[Kalometre] AI hatası", error);
    throw toServiceError(error);
  }
}

/**
 * Sohbet: yalnızca son CHAT_HISTORY_LIMIT mesaj gönderilir. Her mesaj günlük kotadan düşer.
 */
export async function sendChatMessage(
  uid: string,
  todayKey: string,
  history: ChatMessage[],
  message: string,
  context: ChatContext,
): Promise<string> {
  const input = message.trim().slice(0, MAX_INPUT_CHARS);
  try {
    const allowed = await reserveAiRequest(uid, todayKey, DAILY_AI_REQUEST_LIMIT);
    if (!allowed) throw new AiServiceError("daily-limit", MESSAGES["daily-limit"]);

    const model = getGenerativeModel(ai, {
      model: GEMINI_MODEL,
      systemInstruction: buildChatInstruction(context),
      generationConfig: {
        // Kısa yanıt talimatına ek sert sınır: kontrolden çıkan uzun yanıt maliyet üretmesin.
        maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
        ...(GEMINI_THINKING_LEVEL ? { thinkingConfig: { thinkingLevel: GEMINI_THINKING_LEVEL } } : {}),
      } as GenerationConfig,
    });
    // Gemini, sohbetin kullanıcı mesajıyla başlamasını bekler.
    const recent = history.slice(-CHAT_HISTORY_LIMIT);
    while (recent.length && recent[0].role !== "user") recent.shift();
    const contents = [...recent, { role: "user" as const, text: input }].map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
    const result = await model.generateContent({ contents });
    const text = result.response.text().trim();
    if (!text) throw new AiServiceError("bad-response", MESSAGES["bad-response"]);
    return text;
  } catch (error) {
    console.error("[Kalometre] Sohbet hatası", error);
    throw toServiceError(error);
  }
}
