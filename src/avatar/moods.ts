// Hangi durumda hangi duygu gösterilir — tek yerden ayarlanır.
import type { AvatarMood } from "./definition";

/** Ana sayfadaki temel duygu: günün kalori durumuna göre. */
export const HOME_MOODS = {
  empty: "idle",
  onTrack: "happy",
  over: "sad",
} as const satisfies Record<string, AvatarMood>;

/** Giriş/üyelik sonrası ana sayfaya ilk gelişte. */
export const AUTH_MOODS = {
  success: "celebrate",
} as const satisfies Record<string, AvatarMood>;

/** Kısa süreli tepkiler (ms). */
export const REACTION_MS = 1800;
export const TYPING_MS = 1200;
/** Başarıda yeşil kutlama süresi. */
export const CELEBRATE_MS = 1600;
/** İmleç bu süre hareketsiz kalırsa avatar ekranın duygusuna döner. */
export const GAZE_IDLE_MS = 1500;

export const INPUT_MOODS = {
  typing: "listening",
  password: "shy",
} as const satisfies Record<string, AvatarMood>;

/** Avatara dokunulunca. */
export const TAP_MOOD: AvatarMood = "laughing";

/**
 * Tıklanınca avatarın kısa süre oynatacağı duygu. Tip güvenli kullanım:
 *   <button {...onTapMood("celebrate")}>…</button>
 */
export function onTapMood(mood: AvatarMood): { "data-avatar": AvatarMood } {
  return { "data-avatar": mood };
}
