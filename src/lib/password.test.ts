import { describe, expect, it } from "vitest";
import { validatePasswordChange } from "./password";

describe("validatePasswordChange", () => {
  it("geçerli değişiklik", () => {
    expect(validatePasswordChange("eski123", "yeni456", "yeni456")).toBeNull();
  });
  it("mevcut şifre boşsa", () => {
    expect(validatePasswordChange("", "yeni456", "yeni456")).toContain("Mevcut");
  });
  it("yeni şifre 6 karakterden kısaysa", () => {
    expect(validatePasswordChange("eski123", "12345", "12345")).toContain("6");
  });
  it("yeni şifre eskisiyle aynıysa", () => {
    expect(validatePasswordChange("eski123", "eski123", "eski123")).toContain("farklı");
  });
  it("tekrar eşleşmiyorsa", () => {
    expect(validatePasswordChange("eski123", "yeni456", "yeni457")).toContain("aynı değil");
  });
});
