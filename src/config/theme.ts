// Tema: yalnızca 4 marka rengi. Yeşil = olumlu, kırmızı = olumsuz, kahve/porselen = genel.
// Açık temada yazı kahve, zemin porselen; koyu temada tersi. CSS karşılıkları styles.css'te.

export const COLORS = {
  teal: "#4E6E58",
  coffee: "#261C15",
  porcelain: "#F7F7F2",
  brick: "#BB0A21",
} as const;

/** Aynı rengin saydam hâli (SVG için). */
export const alpha = (hex: string, opacity: number) =>
  hex + Math.round(opacity * 255).toString(16).padStart(2, "0");

/** İki paleti rengini karıştırır (yeni ton değil; koyu zeminde okunurluk için açıltma). */
export function mixHex(a: string, b: string, weightA: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ca, cb] = [parse(a), parse(b)];
  return (
    "#" +
    ca.map((v, i) => Math.round(v * weightA + cb[i] * (1 - weightA)).toString(16).padStart(2, "0")).join("").toUpperCase()
  );
}

export type ThemeName = "light" | "dark";

export interface ThemeColors {
  /** Yazı ve ön plan. */
  ink: string;
  /** Zemin. */
  paper: string;
  /** Olumlu yazı/çizgi (koyu zeminde açıltılmış yeşil). */
  positive: string;
  /** Olumsuz yazı/çizgi (koyu zeminde açıltılmış kırmızı). */
  negative: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  light: { ink: COLORS.coffee, paper: COLORS.porcelain, positive: COLORS.teal, negative: COLORS.brick },
  dark: {
    ink: COLORS.porcelain,
    paper: COLORS.coffee,
    // Saf yeşil/kırmızı kahve zeminde ~2,5:1 kontrastla okunmuyor; porselenle karıştırılınca 7:1 ve 4,7:1.
    positive: mixHex(COLORS.teal, COLORS.porcelain, 0.55),
    negative: mixHex(COLORS.brick, COLORS.porcelain, 0.6),
  },
};

// ---------- Seçili tema (tarayıcıda saklanır) ----------

const STORAGE_KEY = "kalometre.theme";
const listeners = new Set<() => void>();

function readStored(): ThemeName {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

let current: ThemeName = readStored();

/** <html data-theme> ve tarayıcı çubuğu rengini uygular. */
export function applyTheme(theme: ThemeName = current): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES[theme].paper);
}

export function getTheme(): ThemeName {
  return current;
}

export function setTheme(theme: ThemeName): void {
  if (theme === current) return;
  current = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Gizli sekme vb.: tercih yalnızca bu oturumda geçerli olur.
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

export function toggleTheme(): void {
  setTheme(current === "dark" ? "light" : "dark");
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
