// Avatarın imlece/tıklamaya bakması: ekran noktası → baş açısı → en yakın hazır bakış ifadesi.
// Saf fonksiyonlar; testi gaze.test.ts.

/** Sağa-sola bakış açıları (derece, + sağ). */
export const GAZE_YAWS = [-28, -21, -14, -7, 0, 7, 14, 21, 28] as const;
/** Yukarı-aşağı bakış açıları (derece, + yukarı). Avatar üstte durduğu için çoğunlukla aşağı bakar. */
export const GAZE_PITCHES = [-18, -12, -6, 0, 6] as const;

// Daha büyük açılarda gözler kürenin kenarına kayıp kayboluyor.
const MAX_YAW = 28;
const MAX_DOWN = 18;
const MAX_UP = 6;

export interface Point {
  x: number;
  y: number;
}

export interface Gaze {
  yaw: number;
  pitch: number;
  key: string;
}

/** "gaze-l40-d24" gibi ifade anahtarı (avatar şemasının anahtar kalıbına uyar). */
export function gazeKey(yaw: number, pitch: number): string {
  const h = yaw === 0 ? "c0" : `${yaw < 0 ? "l" : "r"}${Math.abs(yaw)}`;
  const v = pitch === 0 ? "c0" : `${pitch < 0 ? "d" : "u"}${Math.abs(pitch)}`;
  return `gaze-${h}-${v}`;
}

export const GAZE_KEYS: string[] = GAZE_PITCHES.flatMap((p) => GAZE_YAWS.map((y) => gazeKey(y, p)));

const nearest = (values: readonly number[], v: number) =>
  values.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best));

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Avatar merkezinden bakılan noktaya göre en yakın bakış yönü. */
export function gazeToward(point: Point, center: Point, viewport: { w: number; h: number }): Gaze {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const yawRaw = clamp(dx / (viewport.w / 2), -1, 1) * MAX_YAW;
  const pitchRaw = dy >= 0 ? -clamp(dy / (viewport.h * 0.7), 0, 1) * MAX_DOWN : clamp(-dy / 80, 0, 1) * MAX_UP;
  const yaw = nearest(GAZE_YAWS, yawRaw);
  const pitch = nearest(GAZE_PITCHES, pitchRaw);
  return { yaw, pitch, key: gazeKey(yaw, pitch) };
}
