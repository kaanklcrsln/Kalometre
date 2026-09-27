import { describe, expect, it } from "vitest";
import { analysisSummary, entryFromSuggestion, suggestionFromAnalysis, suggestionFromText } from "./chatFood";

const photo = {
  isFood: true,
  assumptions: "",
  items: [
    { name: "Lahmacun", amount: "1 adet", grams: 160, kcal: 280 },
    { name: "Ayran", amount: "1 bardak", grams: 200, kcal: 75 },
  ],
};

describe("sohbetten öğüne ekleme", () => {
  it("metinden öneri: tek kalem", () => {
    const s = suggestionFromText(" 2 lahmacun ve 1 ayran ", 750.4, "öğlen 2 lahmacun ve bir ayran içtim");
    expect(s).toEqual({
      name: "2 lahmacun ve 1 ayran",
      kcal: 750,
      items: [{ name: "2 lahmacun ve 1 ayran", amount: "", grams: 0, kcal: 750 }],
      rawText: "öğlen 2 lahmacun ve bir ayran içtim",
    });
  });

  it("fotoğraftan öneri: kalemler korunur, ad birleşir, toplam kod hesaplar", () => {
    const s = suggestionFromAnalysis(photo)!;
    expect(s.name).toBe("Lahmacun, Ayran");
    expect(s.kcal).toBe(355);
    expect(s.items).toHaveLength(2);
    expect(suggestionFromAnalysis({ isFood: false, assumptions: "", items: [] })).toBeNull();
  });

  it("değiştirilmeden onaylanırsa yapay zekânın kalemleri yazılır", () => {
    const e = entryFromSuggestion(suggestionFromAnalysis(photo)!, "Lahmacun, Ayran", 355, "lunch");
    expect(e).toMatchObject({ category: "food", meal: "lunch", rawText: "Fotoğraf", totalKcal: 355, aiKcal: 355, editedByUser: false });
    expect(e.items).toHaveLength(2);
  });

  it("kalori değiştirilirse tek kalem ve düzenlendi işareti", () => {
    const e = entryFromSuggestion(suggestionFromAnalysis(photo)!, "Lahmacun, Ayran", 400, "dinner");
    expect(e.items).toEqual([{ name: "Lahmacun, Ayran", amount: "", grams: 0, kcal: 400 }]);
    expect(e).toMatchObject({ totalKcal: 400, aiKcal: 355, editedByUser: true });
  });

  it("ad boş bırakılırsa önerinin adı kullanılır", () => {
    const e = entryFromSuggestion(suggestionFromText("1 kutu kola", 140, "kola içtim"), "  ", 140, "breakfast");
    expect(e.items[0].name).toBe("1 kutu kola");
    expect(e.editedByUser).toBe(false);
  });

  it("özet her kalemi ve toplamı yazar; yiyecek yoksa uyarı", () => {
    expect(analysisSummary(photo)).toBe("• Lahmacun (1 adet): 280 kcal\n• Ayran (1 bardak): 75 kcal\nToplam yaklaşık 355 kcal.");
    expect(analysisSummary({ isFood: false, assumptions: "", items: [] })).toContain("göremedim");
  });
});
