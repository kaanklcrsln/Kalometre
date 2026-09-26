// Tek renk kaynağı (SVG/recharts için). CSS tarafı styles.css'teki değişkenleri kullanır.
// Yalnızca bu 4 renk kullanılır: yeşil = olumlu, kırmızı = olumsuz, siyah/beyaz = genel.
export const COLORS = {
  teal: "#4E6E58",
  coffee: "#261C15",
  porcelain: "#F7F7F2",
  brick: "#BB0A21",
} as const;

/** Aynı rengin saydam hâli (SVG için). */
export const alpha = (hex: string, opacity: number) =>
  hex + Math.round(opacity * 255).toString(16).padStart(2, "0");
