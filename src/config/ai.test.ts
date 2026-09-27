import { describe, expect, it } from "vitest";
import { buildChatInstruction, CHAT_HISTORY_LIMIT, CHAT_MAX_OUTPUT_TOKENS, CHAT_OFF_TOPIC_REPLY } from "./ai";

const ctx = {
  name: "Kaan",
  dailyCalories: 1500,
  consumedToday: 410,
  bmr: 1900,
  currentWeightKg: 92,
  targetWeightKg: 80,
  targetDate: "2026-12-25",
};

describe("sohbet talimatı", () => {
  it("kısa yanıt ve üslup kurallarını içerir", () => {
    const s = buildChatInstruction(ctx);
    expect(s).toContain("en fazla 2 kısa cümle");
    expect(s).toContain('"selam" → "Selam!"');
    expect(s).toContain("emoji kullanmıyorsa emoji kullanma");
    expect(s).toContain("kullanıcı Kaan");
  });
  it("konu dışı sorular için Şikayet ve Öneri yönlendirmesi", () => {
    const s = buildChatInstruction(ctx);
    expect(s).toContain("model, altyapı");
    expect(s).toContain(CHAT_OFF_TOPIC_REPLY);
    expect(CHAT_OFF_TOPIC_REPLY).toContain("Şikayet ve Öneri");
  });
  it("veri satırı tüm bilgileri içerir", () => {
    expect(buildChatInstruction(ctx)).toContain(
      "Veri: hedef 1500 kcal, bugün 410 kcal alındı, bazal 1900 kcal, kilo 92 → 80 kg (2026-12-25).",
    );
  });
  it("eksik veri 'undefined' ya da 'null' yazmaz", () => {
    const s = buildChatInstruction({ ...ctx, bmr: null, currentWeightKg: null, targetWeightKg: null, targetDate: null });
    expect(s).not.toMatch(/undefined|null/);
    expect(s).toContain("Veri: hedef 1500 kcal, bugün 410 kcal alındı.");
  });
  it("maliyet sınırları", () => {
    expect(CHAT_HISTORY_LIMIT).toBe(6);
    expect(CHAT_MAX_OUTPUT_TOKENS).toBeLessThanOrEqual(150);
  });
});
