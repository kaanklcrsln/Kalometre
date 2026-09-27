import { describe, expect, it } from "vitest";
import { todayNoteId, utcDayNumber, validateNote } from "./notes";

describe("notlar", () => {
  it("kimlik uid ve UTC gün numarasından oluşur", () => {
    const ms = Date.UTC(2026, 8, 27, 12);
    expect(utcDayNumber(ms)).toBe(Math.floor(ms / 86_400_000));
    expect(todayNoteId("abc", ms)).toBe(`abc_${Math.floor(ms / 86_400_000)}`);
  });
  it("gün UTC gece yarısında değişir (Türkiye'de 03:00)", () => {
    const before = Date.UTC(2026, 8, 27, 23, 59);
    const after = Date.UTC(2026, 8, 28, 0, 1);
    expect(utcDayNumber(after) - utcDayNumber(before)).toBe(1);
  });
  it("metin uzunluğu", () => {
    expect(validateNote("  ok ")).not.toBeNull();
    expect(validateNote("Güzel uygulama")).toBeNull();
    expect(validateNote("x".repeat(1001))).not.toBeNull();
  });
});
