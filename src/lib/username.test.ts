import { describe, expect, it } from "vitest";
import { emailToUsername, normalizeUsername, usernameToEmail, validatePassword, validateUsername } from "./username";

describe("kullanıcı adı", () => {
  it("küçük harfe çevirir ve boşlukları kırpar", () => {
    expect(normalizeUsername("  Kaan_K ")).toBe("kaan_k");
  });
  it("geçerli adlar", () => {
    expect(validateUsername("kaan")).toBeNull();
    expect(validateUsername("kaan.k_99")).toBeNull();
  });
  it("geçersiz adlar", () => {
    expect(validateUsername("ka")).not.toBeNull();
    expect(validateUsername("a".repeat(21))).not.toBeNull();
    expect(validateUsername("kağan")).not.toBeNull();
    expect(validateUsername("kaan k")).not.toBeNull();
    expect(validateUsername(".kaan")).not.toBeNull();
    expect(validateUsername("kaan_")).not.toBeNull();
    expect(validateUsername("ka..an")).not.toBeNull();
  });
  it("e-posta gidiş-dönüş", () => {
    expect(usernameToEmail("Kaan")).toBe("kaan@users.kalometre.firebaseapp.com");
    expect(emailToUsername("kaan@users.kalometre.firebaseapp.com")).toBe("kaan");
    expect(emailToUsername(null)).toBe("");
  });
  it("şifre en az 6 karakter", () => {
    expect(validatePassword("12345")).not.toBeNull();
    expect(validatePassword("123456")).toBeNull();
  });
});
