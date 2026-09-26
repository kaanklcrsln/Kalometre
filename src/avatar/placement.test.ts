import { describe, expect, it } from "vitest";
import { findFreeSpot, isSpotFree, overlapArea, type Rect } from "./placement";

const viewport = { w: 400, h: 800 };
const fixedRandom = () => 0;

describe("overlapArea", () => {
  it("kesişim alanı", () => {
    expect(overlapArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(25);
  });
  it("değmeyen dikdörtgenler 0", () => {
    expect(overlapArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(0);
  });
});

describe("findFreeSpot", () => {
  it("engel yoksa en büyük boyutu seçer", () => {
    const spot = findFreeSpot({ viewport, obstacles: [], sizes: [96, 64], random: fixedRandom });
    expect(spot).toMatchObject({ size: 96, crowded: false });
  });

  it("seçilen nokta hiçbir engelle çakışmaz ve ekranda kalır", () => {
    const obstacles: Rect[] = [
      { x: 0, y: 0, w: 400, h: 300 },
      { x: 0, y: 500, w: 400, h: 300 },
      { x: 0, y: 300, w: 200, h: 200 },
    ];
    for (let i = 0; i < 20; i++) {
      const spot = findFreeSpot({ viewport, obstacles, sizes: [96, 64], random: () => i / 20 })!;
      expect(spot.crowded).toBe(false);
      expect(isSpotFree(spot, obstacles)).toBe(true);
      expect(spot.x + spot.size).toBeLessThanOrEqual(viewport.w);
      expect(spot.y + spot.size).toBeLessThanOrEqual(viewport.h);
    }
  });

  it("büyük boyut sığmıyorsa küçüğe düşer", () => {
    // Sağ altta yalnızca ~80px'lik boşluk var.
    const obstacles: Rect[] = [
      { x: 0, y: 0, w: 400, h: 700 },
      { x: 0, y: 700, w: 300, h: 100 },
    ];
    const spot = findFreeSpot({ viewport, obstacles, sizes: [96, 56], random: fixedRandom })!;
    expect(spot.size).toBe(56);
    expect(spot.crowded).toBe(false);
  });

  it("boş yer yoksa en az çakışan yeri 'crowded' olarak döner", () => {
    const spot = findFreeSpot({ viewport, obstacles: [{ x: 0, y: 0, w: 400, h: 800 }], sizes: [96, 56] })!;
    expect(spot.crowded).toBe(true);
    expect(spot.size).toBe(56);
  });

  it("mümkünse mevcut konumdan uzaklaşır", () => {
    const current = { x: 12, y: 12 };
    for (let i = 0; i < 10; i++) {
      const spot = findFreeSpot({ viewport, obstacles: [], sizes: [96], current, minTravel: 150, random: () => i / 10 })!;
      expect(Math.hypot(spot.x - current.x, spot.y - current.y)).toBeGreaterThanOrEqual(150);
    }
  });
});
