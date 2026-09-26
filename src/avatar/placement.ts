// Avatar için ekranda içerikle çakışmayan bir nokta bulur. Saf fonksiyon, testi placement.test.ts.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Spot {
  x: number;
  y: number;
  size: number;
  /** Boş yer bulunamadı; en az çakışan yer seçildi. */
  crowded: boolean;
}

export interface PlacementInput {
  viewport: { w: number; h: number };
  obstacles: Rect[];
  /** Denenecek boyutlar, büyükten küçüğe. */
  sizes: number[];
  /** Ekran kenarından boşluk. */
  margin?: number;
  /** Avatar ile içerik arasında bırakılacak boşluk. */
  padding?: number;
  step?: number;
  /** Mevcut konum: yeni nokta ondan uzak seçilmeye çalışılır. */
  current?: { x: number; y: number } | null;
  minTravel?: number;
  random?: () => number;
}

export function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function totalOverlap(r: Rect, obstacles: Rect[]): number {
  let sum = 0;
  for (const o of obstacles) sum += overlapArea(r, o);
  return sum;
}

/** Verilen noktadaki avatar bu engellerle çakışıyor mu? */
export function isSpotFree(spot: { x: number; y: number; size: number }, obstacles: Rect[], padding = 8): boolean {
  const r = { x: spot.x - padding, y: spot.y - padding, w: spot.size + padding * 2, h: spot.size + padding * 2 };
  return totalOverlap(r, obstacles) === 0;
}

export function findFreeSpot(input: PlacementInput): Spot | null {
  const { viewport, obstacles, sizes, margin = 12, padding = 8, step = 16, current = null, minTravel = 96 } = input;
  const random = input.random ?? Math.random;
  if (sizes.length === 0) return null;

  for (const size of sizes) {
    const maxX = viewport.w - size - margin;
    const maxY = viewport.h - size - margin;
    if (maxX < margin || maxY < margin) continue;

    const free: { x: number; y: number }[] = [];
    for (let y = margin; y <= maxY; y += step) {
      for (let x = margin; x <= maxX; x += step) {
        if (isSpotFree({ x, y, size }, obstacles, padding)) free.push({ x, y });
      }
    }
    if (free.length === 0) continue;

    // Gezinme hissi için mümkünse mevcut konumdan uzak bir nokta seç.
    const far = current ? free.filter((p) => Math.hypot(p.x - current.x, p.y - current.y) >= minTravel) : free;
    const pool = far.length > 0 ? far : free;
    const pick = pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)];
    return { ...pick, size, crowded: false };
  }

  // Hiç boş yer yok: en küçük boyutta en az çakışan noktayı seç.
  const size = sizes[sizes.length - 1];
  const maxX = viewport.w - size - margin;
  const maxY = viewport.h - size - margin;
  if (maxX < margin || maxY < margin) return null;
  let best: Spot | null = null;
  let bestOverlap = Infinity;
  for (let y = margin; y <= maxY; y += step) {
    for (let x = margin; x <= maxX; x += step) {
      const o = totalOverlap({ x, y, w: size, h: size }, obstacles);
      if (o < bestOverlap) {
        bestOverlap = o;
        best = { x, y, size, crowded: true };
      }
    }
  }
  return best;
}
