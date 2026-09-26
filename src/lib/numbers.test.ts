import { describe, expect, it } from "vitest";
import { inRange, parseDecimal } from "./numbers";

describe("parseDecimal", () => {
  it("virgül ve nokta", () => {
    expect(parseDecimal("72,5")).toBe(72.5);
    expect(parseDecimal(" 72.5 ")).toBe(72.5);
    expect(parseDecimal("80")).toBe(80);
  });
  it("geçersiz girdiler NaN", () => {
    expect(parseDecimal("")).toBeNaN();
    expect(parseDecimal("abc")).toBeNaN();
    expect(parseDecimal("7,2,5")).toBeNaN();
  });
});

describe("inRange", () => {
  it("sınırlar dahil", () => {
    expect(inRange(100, 100, 250)).toBe(true);
    expect(inRange(99, 100, 250)).toBe(false);
    expect(inRange(NaN, 0, 1)).toBe(false);
  });
});
