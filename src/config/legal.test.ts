import { describe, expect, it } from "vitest";
import { PHOTO_ANALYSIS_ENABLED } from "./ai";
import { PRIVACY_NOTICE } from "./legal";

describe("gizlilik metni", () => {
  it("fotoğraf cümlesi yalnızca kamera açıkken yer alır", () => {
    expect(PRIVACY_NOTICE.includes("fotoğraf")).toBe(PHOTO_ANALYSIS_ENABLED);
    expect(PRIVACY_NOTICE).toContain("analiz için Google Gemini'ye gönderilir.");
    expect(PRIVACY_NOTICE).not.toMatch(/ {2}|undefined/);
  });
});
