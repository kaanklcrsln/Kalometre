import { describe, expect, it } from "vitest";
import { GAZE_KEYS, gazeKey, gazeToward } from "./gaze";

const viewport = { w: 400, h: 800 };
const center = { x: 200, y: 48 };

describe("gazeKey", () => {
  it("avatar şemasının anahtar kalıbına uyar", () => {
    for (const key of GAZE_KEYS) expect(key).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
  });
  it("yön harfleri", () => {
    expect(gazeKey(0, 0)).toBe("gaze-c0-c0");
    expect(gazeKey(-28, -18)).toBe("gaze-l28-d18");
    expect(gazeKey(14, 6)).toBe("gaze-r14-u6");
  });
  it("45 benzersiz yön; toplam ifade sayısı şema sınırının (128) altında", () => {
    expect(new Set(GAZE_KEYS).size).toBe(45);
    expect(28 + GAZE_KEYS.length).toBeLessThanOrEqual(128);
  });
});

describe("gazeToward", () => {
  it("tam altı: düz aşağı", () => {
    expect(gazeToward({ x: 200, y: 700 }, center, viewport)).toMatchObject({ yaw: 0, pitch: -18 });
  });
  it("sol alt köşe: sola ve aşağı", () => {
    const g = gazeToward({ x: 0, y: 800 }, center, viewport);
    expect(g.yaw).toBe(-28);
    expect(g.pitch).toBe(-18);
  });
  it("sağ, aynı yükseklik: sağa, düz", () => {
    expect(gazeToward({ x: 400, y: 48 }, center, viewport)).toMatchObject({ yaw: 28, pitch: 0 });
  });
  it("hemen üstü: biraz yukarı", () => {
    expect(gazeToward({ x: 200, y: 0 }, center, viewport).pitch).toBe(6);
  });
  it("merkeze yakın küçük hareketler düz bakışta kalır", () => {
    expect(gazeToward({ x: 205, y: 52 }, center, viewport)).toMatchObject({ yaw: 0, pitch: 0 });
  });
  it("ekran dışı noktalar sınırda kalır", () => {
    expect(gazeToward({ x: -5000, y: 99999 }, center, viewport)).toMatchObject({ yaw: -28, pitch: -18 });
  });
});
