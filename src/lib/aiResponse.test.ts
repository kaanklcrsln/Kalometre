import { describe, expect, it } from "vitest";
import { parseAiAnalysis, parseChatReply } from "./aiResponse";

describe("parseAiAnalysis", () => {
  it("geçerli yanıtı ayrıştırır", () => {
    const r = parseAiAnalysis(
      JSON.stringify({
        items: [{ name: "Simit", amount: "1 adet", grams: 100, kcal: 275.6 }],
        assumptions: "Standart simit",
        isFood: true,
      }),
    );
    expect(r).toEqual({
      items: [{ name: "Simit", amount: "1 adet", grams: 100, kcal: 276 }],
      assumptions: "Standart simit",
      isFood: true,
    });
  });
  it("geçersiz JSON için null", () => {
    expect(parseAiAnalysis("not json")).toBeNull();
    expect(parseAiAnalysis("42")).toBeNull();
  });
  it("isFood=false ise kalemleri boşaltır", () => {
    const r = parseAiAnalysis(JSON.stringify({ items: [{ name: "Masa", kcal: 10 }], assumptions: "", isFood: false }));
    expect(r?.isFood).toBe(false);
    expect(r?.items).toEqual([]);
  });
  it("kalem yoksa yiyecek sayılmaz", () => {
    expect(parseAiAnalysis(JSON.stringify({ items: [], assumptions: "", isFood: true }))?.isFood).toBe(false);
  });
  it("negatif, metin ve aşırı değerleri temizler", () => {
    const r = parseAiAnalysis(
      JSON.stringify({
        items: [
          { name: "A", amount: "x", grams: -5, kcal: "120" },
          { name: "", amount: 3, grams: 99999, kcal: 99999 },
        ],
        isFood: true,
      }),
    );
    expect(r?.items).toEqual([
      { name: "A", amount: "x", grams: 0, kcal: 120 },
      { name: "Bilinmeyen", amount: "", grams: 5000, kcal: 5000 },
    ]);
  });
});

describe("parseChatReply", () => {
  it("yemek anlatılınca öneri döner", () => {
    expect(parseChatReply(JSON.stringify({ reply: "Yaklaşık 750 kalori.", food: "2 lahmacun ve 1 ayran", kcal: 749.6 }))).toEqual({
      text: "Yaklaşık 750 kalori.",
      food: { name: "2 lahmacun ve 1 ayran", kcal: 750 },
    });
  });
  it("soru ya da sohbet: öneri yok", () => {
    expect(parseChatReply(JSON.stringify({ reply: "Selam!", food: "", kcal: 0 }))).toEqual({ text: "Selam!", food: null });
    expect(parseChatReply(JSON.stringify({ reply: "Selam!", food: "elma", kcal: 0 }))?.food).toBeNull();
  });
  it("kalori sınırlanır, ad kırpılır", () => {
    const r = parseChatReply(JSON.stringify({ reply: "x", food: "a".repeat(200), kcal: 99999 }));
    expect(r?.food).toEqual({ name: "a".repeat(80), kcal: 5000 });
  });
  it("düz metin yanıt kabul edilir, boş yanıt null", () => {
    expect(parseChatReply("Selam!")).toEqual({ text: "Selam!", food: null });
    expect(parseChatReply(JSON.stringify({ reply: "", food: "", kcal: 0 }))).toBeNull();
    expect(parseChatReply("  ")).toBeNull();
  });
});
