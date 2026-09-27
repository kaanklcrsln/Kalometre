import { useEffect, useState, type RefObject } from "react";
import { gazeToward, type Gaze, type Point } from "./gaze";

export interface GazeOptions {
  /** Yazı yazılırken metin kutusundaki imlecin (caret) konumuna bak. */
  trackTyping?: boolean;
}

let measureCanvas: HTMLCanvasElement | null = null;

/** Metin kutusundaki imlecin yaklaşık ekran konumu (son satırdaki yazı genişliği ölçülerek). */
function caretPoint(el: HTMLInputElement | HTMLTextAreaElement): Point {
  const r = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  measureCanvas ??= document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  const before = el.value.slice(0, el.selectionStart ?? el.value.length);
  const line = before.split("\n").pop() ?? "";
  let width = 0;
  if (ctx) {
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    width = ctx.measureText(line).width;
  }
  const x = Math.min(r.left + parseFloat(style.paddingLeft || "0") + width, r.right - 8);
  return { x, y: r.top + r.height / 2 };
}

const isTextField = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && ["text", "search", ""].includes(el.type));

/**
 * Fare hareketini, tıklama/dokunma noktasını ve (isteğe bağlı) yazı imlecini izler;
 * avatarın bakması gereken yönü döner. `idleMs` boyunca hareket olmazsa null döner.
 */
export function useGaze(ref: RefObject<HTMLElement | null>, idleMs: number, options: GazeOptions = {}): Gaze | null {
  const [gaze, setGaze] = useState<Gaze | null>(null);
  const { trackTyping = false } = options;

  useEffect(() => {
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let last: Point | null = null;

    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el || !last) return;
      const r = el.getBoundingClientRect();
      const next = gazeToward(last, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, { w: window.innerWidth, h: window.innerHeight });
      setGaze((prev) => (prev?.key === next.key ? prev : next));
    };

    const lookAt = (point: Point) => {
      last = point;
      if (!frame) frame = requestAnimationFrame(update);
      clearTimeout(idle);
      idle = setTimeout(() => setGaze(null), idleMs);
    };

    const onPointer = (e: PointerEvent) => lookAt({ x: e.clientX, y: e.clientY });
    // Yazarken ve imleç ok tuşlarıyla gezerken imlecin olduğu yere bak.
    const onCaret = () => {
      const el = document.activeElement;
      if (isTextField(el)) lookAt(caretPoint(el));
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    if (trackTyping) {
      document.addEventListener("input", onCaret);
      document.addEventListener("selectionchange", onCaret);
    }
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("input", onCaret);
      document.removeEventListener("selectionchange", onCaret);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
    };
  }, [ref, idleMs, trackTyping]);

  return gaze;
}
