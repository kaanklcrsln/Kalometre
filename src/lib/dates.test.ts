import { describe, expect, it } from "vitest";
import { addDaysToKey, daysBetween, fromDateKey, toDateKey } from "./dates";

describe("dates", () => {
  it("yerel tarihten anahtar üretir", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 0, 6, 0, 1))).toBe("2026-01-06");
  });
  it("anahtar ↔ tarih gidiş-dönüş", () => {
    expect(toDateKey(fromDateKey("2026-09-26"))).toBe("2026-09-26");
  });
  it("ay ve yıl sınırlarını geçer", () => {
    expect(addDaysToKey("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("gün farkı (yaz saati geçişi dahil)", () => {
    expect(daysBetween("2026-03-01", "2026-04-01")).toBe(31);
    expect(daysBetween("2026-10-20", "2026-11-05")).toBe(16);
  });
});
