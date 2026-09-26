import { useCallback, useEffect, useRef, useState } from "react";
import { findFreeSpot, isSpotFree, type Rect, type Spot } from "./placement";

/** Avatarın üstüne gelmemesi gereken içerik. `data-avatar-obstacle` ile başka öğeler de eklenebilir. */
const OBSTACLE_SELECTOR = [
  "main h1",
  "main h2",
  "main h3",
  "main p",
  "main label",
  "main input",
  "main select",
  "main textarea",
  "main button",
  "main a",
  "main table",
  "main .card",
  "main .alert",
  "main .note",
  "main .progress",
  "main .recharts-wrapper",
  "main figure",
  "nav.bottom",
  "[data-avatar-obstacle]",
].join(",");

const TEXT_TAGS = new Set(["H1", "H2", "H3", "P"]);

/** Metin blokları tüm satırı kaplamasın diye yazının gerçek sınırları ölçülür. */
function measure(el: Element): DOMRect {
  if (TEXT_TAGS.has(el.tagName)) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return el.getBoundingClientRect();
}

function measureObstacles(self: Element | null): Rect[] {
  const rects: Rect[] = [];
  document.querySelectorAll(OBSTACLE_SELECTOR).forEach((el) => {
    if (self?.contains(el)) return;
    const r = measure(el);
    if (r.width === 0 || r.height === 0) return;
    rects.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  });
  return rects;
}

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export interface RoamingOptions {
  /** Denenecek boyutlar, büyükten küçüğe. */
  sizes?: number[];
  /** Bu değer değişince (ör. adım) avatar hemen yeni bir boş yere gider. */
  trigger?: unknown;
  wanderMinMs?: number;
  wanderMaxMs?: number;
}

export function useRoaming(selfRef: React.RefObject<HTMLElement | null>, options: RoamingOptions = {}) {
  const { sizes = [104, 80, 60], trigger, wanderMinMs = 5000, wanderMaxMs = 8500 } = options;
  const [spot, setSpot] = useState<Spot | null>(null);
  const [moving, setMoving] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const spotRef = useRef<Spot | null>(null);
  const movingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizesKey = sizes.join(",");

  /** force: boş olsa bile yeni bir yere git (gezinme). */
  const place = useCallback(
    (force: boolean) => {
      const obstacles = measureObstacles(selfRef.current);
      const current = spotRef.current;
      if (!force && current && !current.crowded && isSpotFree(current, obstacles)) return;
      const next = findFreeSpot({
        viewport: { w: window.innerWidth, h: window.innerHeight },
        obstacles,
        sizes: sizesKey.split(",").map(Number),
        current,
      });
      if (!next) return;

      const distance = current ? Math.hypot(next.x - current.x, next.y - current.y) : 0;
      const ms = current ? Math.round(Math.min(Math.max(distance * 6, 700), 2200)) : 0;
      if (current && next.x !== current.x) setDirection(next.x > current.x ? 1 : -1);
      spotRef.current = next;
      setDurationMs(ms);
      setSpot(next);
      if (ms > 0) {
        setMoving(true);
        if (movingTimer.current) clearTimeout(movingTimer.current);
        movingTimer.current = setTimeout(() => setMoving(false), ms);
      }
    },
    [selfRef, sizesKey],
  );

  // Adım değişince içerik yerleştikten sonra yeni boş yere git.
  useEffect(() => {
    const t = setTimeout(() => place(true), 80);
    return () => clearTimeout(t);
  }, [trigger, place]);

  // İçerik değişirse (hata mesajı, yeni satır…) ve avatarın üstüne gelirse kaç.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const check = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => place(false), 150);
    };
    // Avatarın kendi SVG animasyonları sayılmaz.
    const observer = new MutationObserver((mutations) => {
      const self = selfRef.current;
      if (self && mutations.every((m) => self.contains(m.target))) return;
      check();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
      if (t) clearTimeout(t);
    };
  }, [place, selfRef]);

  // Arada bir kendiliğinden gezin.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        place(true);
        schedule();
      }, wanderMinMs + Math.random() * (wanderMaxMs - wanderMinMs));
    };
    schedule();
    return () => clearTimeout(t);
  }, [place, wanderMinMs, wanderMaxMs]);

  useEffect(() => () => {
    if (movingTimer.current) clearTimeout(movingTimer.current);
  }, []);

  return { spot, moving, durationMs, direction };
}
