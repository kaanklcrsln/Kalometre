import { describe, expect, it } from "vitest";
import { isKaloPlusActive } from "./entitlement";

const now = Date.UTC(2026, 8, 27);
const day = 86_400_000;

describe("isKaloPlusActive", () => {
  it("aktif ve süresi dolmamış abonelik erişim verir", () => {
    expect(isKaloPlusActive({ plan: "kalo_plus", status: "active", expiresAtMs: now + day, source: "google_play" }, now)).toBe(true);
  });
  it("ödeme ek süresi (grace) erişim verir", () => {
    expect(isKaloPlusActive({ plan: "kalo_plus", status: "grace", expiresAtMs: now + day }, now)).toBe(true);
  });
  it("süresi dolmuşsa erişim yok", () => {
    expect(isKaloPlusActive({ plan: "kalo_plus", status: "active", expiresAtMs: now - 1 }, now)).toBe(false);
  });
  it("iptal, askıda, bitmiş durumlar erişim vermez", () => {
    for (const status of ["canceled", "on_hold", "paused", "expired"] as const) {
      expect(isKaloPlusActive({ plan: "kalo_plus", status, expiresAtMs: now + day }, now)).toBe(false);
    }
  });
  it("doküman yoksa ya da bozuksa erişim yok", () => {
    expect(isKaloPlusActive(null, now)).toBe(false);
    expect(isKaloPlusActive(undefined, now)).toBe(false);
    expect(isKaloPlusActive({ status: "active", expiresAtMs: now + day }, now)).toBe(false);
    expect(isKaloPlusActive({ plan: "kalo_plus", status: "active" }, now)).toBe(false);
  });
});
